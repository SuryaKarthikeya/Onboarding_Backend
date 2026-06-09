import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function CostDataIngestion({ onNavigate }) {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('cost_data_active_tab');
    localStorage.removeItem('cost_data_active_tab');
    return saved || 'manual';
  }); // 'manual', 'csv', or 'quickbooks'

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('COGS');
  const [customCategory, setCustomCategory] = useState('');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // QuickBooks States
  const [qbConnected, setQbConnected] = useState(false);
  const [qbRealmId, setQbRealmId] = useState('');
  const [isCheckingQb, setIsCheckingQb] = useState(true);

  const token = localStorage.getItem('auth_token');

  // Fetch ingestion history, QuickBooks status, and parse callback parameters on mount
  useEffect(() => {
    fetchHistory();
    fetchQbStatus();
    checkQbUrlParams();
  }, []);

  const handleSessionExpired = () => {
    triggerNotification('error', 'Your session has expired. Please sign in again.');
    setTimeout(() => {
      localStorage.removeItem('auth_token');
      onNavigate('signin');
    }, 2000);
  };

  const fetchHistory = async () => {
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const response = await fetch('http://localhost:8000/v1/cost-data/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Sort entries by created_at descending
        const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setHistory(sorted);
      } else if (response.status === 401) {
        handleSessionExpired();
      }
    } catch (err) {
      console.error('Error fetching cost history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchQbStatus = async () => {
    if (!token) return;
    setIsCheckingQb(true);
    try {
      const response = await fetch('http://localhost:8000/v1/marketplace/quickbooks/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setQbConnected(data.connected);
        setQbRealmId(data.company_id || '');
      } else if (response.status === 401) {
        // Only trigger redirect on explicit actions to prevent loading loop collisions
        localStorage.removeItem('auth_token');
        onNavigate('signin');
      }
    } catch (err) {
      console.error('Error fetching QuickBooks status:', err);
    } finally {
      setIsCheckingQb(false);
    }
  };

  const checkQbUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const qbStatus = params.get('quickbooks');
    const realmId = params.get('realm_id');
    if (qbStatus === 'success') {
      setQbConnected(true);
      if (realmId) setQbRealmId(realmId);
      triggerNotification('success', 'QuickBooks financial ledger integrated successfully!');
      // Clear URL parameters cleanly
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const triggerNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      triggerNotification('error', 'A valid session is required. Please sign up or sign in.');
      return;
    }

    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    if (!finalCategory) {
      triggerNotification('error', 'Please specify a category.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      triggerNotification('error', 'Amount must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/v1/cost-data/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parsedAmount,
          category: finalCategory
        })
      });

      const data = await response.json();
      if (response.ok) {
        triggerNotification('success', `Successfully added manual entry: $${parsedAmount.toFixed(2)} in ${finalCategory}`);
        setAmount('');
        if (category === 'Other') setCustomCategory('');
        fetchHistory(); // Reload history
      } else if (response.status === 401) {
        handleSessionExpired();
      } else {
        triggerNotification('error', data.detail || 'Failed to submit manual cost entry');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Connection error. Please verify your backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      triggerNotification('error', 'Please select a CSV file to upload.');
      return;
    }

    if (!token) {
      triggerNotification('error', 'A valid session is required. Please sign in first.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/v1/cost-data/upload-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        triggerNotification('success', `Ingested ${data.length} cost records from CSV successfully!`);
        setFile(null);
        fetchHistory(); // Reload history
      } else if (response.status === 401) {
        handleSessionExpired();
      } else {
        triggerNotification('error', data.detail || 'Failed to parse and upload CSV worksheet');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Error connecting to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQbConnect = async () => {
    if (!token) {
      triggerNotification('error', 'A valid session is required. Please sign in first.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8000/v1/marketplace/quickbooks/install?state=${token}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.install_url) {
        window.location.href = data.install_url;
      } else if (response.status === 401) {
        handleSessionExpired();
      } else {
        triggerNotification('error', data.detail || 'Failed to generate QuickBooks authorization URL.');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Connection error. Please verify your backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQbDisconnect = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/v1/marketplace/quickbooks/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setQbConnected(false);
        setQbRealmId('');
        triggerNotification('success', 'QuickBooks integration disconnected successfully.');
      } else if (response.status === 401) {
        handleSessionExpired();
      } else {
        const data = await response.json();
        triggerNotification('error', data.detail || 'Failed to disconnect QuickBooks.');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Error connecting to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag and drop events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        triggerNotification('error', 'Unsupported file type. Please upload a .csv spreadsheet.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        triggerNotification('error', 'Unsupported file type. Please select a .csv spreadsheet.');
      }
    }
  };

  // Helper metrics
  const totalCostIngested = history.reduce((acc, curr) => acc + curr.amount, 0);
  const manualCount = history.filter(item => item.source === 'manual').length;
  const csvCount = history.filter(item => item.source === 'csv').length;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8f9ff]">
      {/* Stepper Sidebar */}
      <Sidebar activeStep={3} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center bg-[#f8f9ff] overflow-y-auto text-gray-900 min-h-screen relative">

        {/* Floating Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border text-sm font-semibold animate-in slide-in-from-top duration-300 ${notification.type === 'success'
              ? 'bg-[#e6fcf4] border-[#00c38b]/30 text-[#006c4b]'
              : 'bg-[#fdf2f2] border-red-200 text-red-700'
            }`}>
            <span className="material-symbols-outlined text-[20px]">
              {notification.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{notification.message}</span>
          </div>
        )}

        <div className="w-full max-w-5xl py-12 px-6 md:px-12 space-y-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/60 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Cost Data Ingestion</h2>
              <p className="text-sm text-gray-500 mt-1">Provide your cost of goods sold (COGS) and expense variables to unlock margin intelligence</p>
            </div>

            {/* Quick Stats Summary Card */}
            <div className="flex gap-4 items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm self-start">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-[#006c4b]">
                <span className="material-symbols-outlined text-[22px]">payments</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Costs Recorded</p>
                <p className="text-lg font-bold text-gray-900">${totalCostIngested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* INGESTION INPUTS (7 Columns) */}
            <div className="lg:col-span-7 space-y-6">

              {/* Tab Selector */}
              <div className="flex bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'manual'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('csv')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'csv'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  CSV Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('quickbooks')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'quickbooks'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                  QuickBooks
                </button>
              </div>

              {/* Input Card Panel */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

                {activeTab === 'manual' && (
                  /* MANUAL ENTRY FORM */
                  <form onSubmit={handleManualSubmit} className="space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[#006c4b]">
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Create Manual Cost Record</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Amount Field */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-600" htmlFor="cost-amount">Expense Amount ($)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                          <input
                            required
                            type="number"
                            id="cost-amount"
                            min="0.01"
                            step="any"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Category Selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-600" htmlFor="cost-category">Cost Category</label>
                        <select
                          id="cost-category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                        >
                          <option value="COGS">Cost of Goods Sold (COGS)</option>
                          <option value="Marketing">Marketing & Ads</option>
                          <option value="Shipping">Shipping & Fulfillment</option>
                          <option value="Software">Software & Subscriptions</option>
                          <option value="Rent">Rent & Utilities</option>
                          <option value="Other">Other Expenses</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Category Input if "Other" is selected */}
                    {category === 'Other' && (
                      <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                        <label className="text-xs font-bold text-gray-600" htmlFor="custom-category">Specify Category Name</label>
                        <input
                          required
                          type="text"
                          id="custom-category"
                          placeholder="e.g. Legal Consulting, Office Supplies"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-black active:scale-[0.99] transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Add Cost Entry
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'csv' && (
                  /* CSV UPLOAD INTERFACE */
                  <form onSubmit={handleCsvSubmit} className="space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[#006c4b]">
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Upload Expense CSV Sheet</h3>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${dragActive
                          ? 'border-primary bg-primary/5 scale-[1.01]'
                          : file
                            ? 'border-green-300 bg-green-50/5'
                            : 'border-gray-300 hover:border-gray-400 bg-[#fbfbfe]'
                        }`}
                    >
                      <input
                        type="file"
                        id="csv-file-picker"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />

                      <div className="space-y-3 pointer-events-none">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${file ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                          <span className="material-symbols-outlined text-[28px]">
                            {file ? 'description' : 'upload_file'}
                          </span>
                        </div>

                        {file ? (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB • Ready to Ingest</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-700">Drag & drop your CSV file here</p>
                            <p className="text-xs text-gray-400">or click to browse local files</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CSV Formatting Instructions */}
                    <div className="bg-gray-50 border border-gray-200/80 rounded-lg p-4 space-y-2 text-left">
                      <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                        CSV Format Guide:
                      </p>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Ensure your spreadsheet template includes columns for **Amount** (representing expense value) and **Category** (classification label). The parser supports mapping columns dynamically from standard exports.
                      </p>
                      <div className="text-[10px] font-mono bg-white border border-gray-200 rounded px-2.5 py-1.5 text-gray-400 self-start inline-block">
                        amount,category<br />
                        145.20,Marketing<br />
                        1250.00,COGS
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      {file && (
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting || !file}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-black active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">rocket</span>
                            Upload & Parse Spreadsheet
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'quickbooks' && (
                  /* QUICKBOOKS INTERFACE */
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[#006c4b]">
                        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">QuickBooks Online Integration</h3>
                    </div>

                    {isCheckingQb ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                        <span className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                        <span className="text-xs">Checking integration status...</span>
                      </div>
                    ) : qbConnected ? (
                      /* Connected State UI */
                      <div className="space-y-6">
                        <div className="p-6 border border-[#00c38b]/30 bg-[#e6fcf4]/20 rounded-xl space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-3xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                                check_circle
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-gray-900">Successfully Connected</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                                  <span className="text-[10px] text-primary-dark font-bold uppercase tracking-wider">Active Syncing</span>
                                </div>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-white border border-[#00c38b]/20 text-[#006c4b] rounded-full text-[10px] font-bold shadow-sm">
                              QB Accounting
                            </span>
                          </div>

                          <div className="border-t border-[#00c38b]/10 pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-xs">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Company ID (Realm ID)</p>
                              <p className="font-mono font-bold text-gray-700 mt-0.5">{qbRealmId || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sync Frequency</p>
                              <p className="font-bold text-gray-700 mt-0.5">Automated / Real-time</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200/80 rounded-lg p-4 space-y-2 text-left">
                          <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-primary">sync</span>
                            Auto-sync Active
                          </p>
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            Expenses recorded in your QuickBooks ledger are automatically imported and mapped. Custom expense classifications inside QuickBooks will automatically synchronize with your margins dashboard.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleQbDisconnect}
                          disabled={isSubmitting}
                          className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-700 bg-red-50/20 hover:bg-red-50 rounded-lg text-sm font-semibold active:scale-[0.99] transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-red-700 border-t-transparent" />
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">link_off</span>
                              Disconnect QuickBooks Integration
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Disconnected UI */
                      <div className="space-y-6">
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Automate your cost tracking by securely linking your QuickBooks Online accounting organization. Realify AI automatically processes ledger transactions to resolve COGS and marketing overhead.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 border border-gray-100 bg-gray-50/40 rounded-lg space-y-1">
                            <span className="material-symbols-outlined text-primary text-[20px]">sync_alt</span>
                            <h4 className="text-xs font-bold text-gray-800">Ledger Auto-Sync</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed">Synchronizes accounting line-items to map COGS variables dynamically.</p>
                          </div>
                          <div className="p-4 border border-gray-100 bg-gray-50/40 rounded-lg space-y-1">
                            <span className="material-symbols-outlined text-brand-accent text-[20px]">security</span>
                            <h4 className="text-xs font-bold text-gray-800">Secure Protocol</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed">Uses Intuit OAuth standard authentication with full data encryption.</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleQbConnect}
                          disabled={isSubmitting}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-800 hover:bg-black text-white rounded-lg text-sm font-semibold active:scale-[0.99] transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                              Connect QuickBooks Online
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* COST DATA HISTORY LOGS (5 Columns) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[480px]">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-500 text-[18px]">history</span>
                    <h3 className="font-bold text-sm text-gray-900">Ingested Logs</h3>
                  </div>
                  <span className="bg-gray-200/80 text-gray-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {history.length} items
                  </span>
                </div>

                {/* Main Scrollable View */}
                <div className="flex-1 overflow-y-auto p-4">
                  {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                      <span className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                      <span className="text-xs">Loading logs...</span>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-4 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-300">
                        <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">No records found</p>
                        <p className="text-[11px] mt-1 max-w-[200px] mx-auto text-gray-400">Add a manual expense or upload a CSV to populate this registry.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border border-gray-100 bg-[#fbfbfe] rounded-lg shadow-sm hover:border-gray-200 transition-all"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-gray-900 truncate">{item.category}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                              {new Date(item.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-bold text-gray-800">
                              ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>

                            {/* Source Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${item.source === 'manual'
                                ? 'bg-[#e6fcf4] border-[#00c38b]/30 text-[#006c4b]'
                                : 'bg-[#eef2ff] border-indigo-200 text-indigo-700'
                              }`}>
                              {item.source}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary Metrics Footer */}
                {history.length > 0 && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex justify-around text-center shrink-0">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Manual Logs</p>
                      <p className="text-sm font-bold text-gray-800">{manualCount}</p>
                    </div>
                    <div className="w-[1px] bg-gray-200" />
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">CSV Sheets</p>
                      <p className="text-sm font-bold text-gray-800">{csvCount}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Page Actions Footer */}
          <div className="flex justify-between items-center border-t border-gray-200/60 pt-8">
            <button
              type="button"
              onClick={() => onNavigate('connect-marketplaces')}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 bg-white rounded-lg text-gray-700 font-bold hover:bg-gray-50 active:scale-[0.98] transition-all text-sm"
            >
              <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
              Back
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem('celebration_seen', 'false'); // Let them see celebration again on completion
                onNavigate('celebration');
              }}
              className="flex items-center gap-2 px-12 py-3 bg-[#1e2532] hover:bg-black text-white rounded-lg font-bold shadow-lg active:scale-[0.98] transition-all text-sm"
            >
              Save & Complete Setup
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
