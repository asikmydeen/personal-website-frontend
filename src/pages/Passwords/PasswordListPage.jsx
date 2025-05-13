import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import {
  Eye, EyeOff, Search, Plus, Copy, Trash2, Edit, Key, Lock,
  AlertTriangle, RefreshCcw, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import AnimatedModal from '../../components/animated/AnimatedModal';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  getPasswordDetails, addPassword, updatePassword,
  deletePassword, generateStrongPassword
} from '../../services/passwordService';
import PasswordGeneratorComponent from '../../components/passwords/PasswordGeneratorComponent';
import AddEditPasswordComponent from '../../components/passwords/AddEditPasswordComponent';

const PasswordListPage = () => {
  const { passwords, fetchPasswords, setPasswords } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('serviceName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedPassword, setSelectedPassword] = useState(null);
  const [passwordDetails, setPasswordDetails] = useState(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // Password for demo purposes
  const demoMasterPassword = 'correct-master-password';

  useEffect(() => {
    const loadPasswords = async () => {
      setLoading(true);
      try {
        await fetchPasswords();
      } catch (err) {
        setError('Failed to load passwords. Please try again.');
        console.error('Error fetching passwords:', err);
      }
      setLoading(false);
    };

    loadPasswords();
  }, [fetchPasswords]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewPasswordDetails = async (passwordId) => {
    setSelectedPassword(passwordId);
    setIsViewDialogOpen(true);
    setMasterPassword('');
    setPasswordDetails(null);
    setError('');
  };

  const handlePasswordReveal = async () => {
    setLoading(true);
    try {
      const response = await getPasswordDetails(selectedPassword, masterPassword);
      if (response.success) {
        setPasswordDetails(response.data.passwordDetails);
        setError('');
      } else {
        setError('Invalid master password or decryption failed.');
        setPasswordDetails(null);
      }
    } catch (err) {
      setError('An error occurred while retrieving password details.');
      console.error('View password error:', err);
    }
    setLoading(false);
  };

  const handleCopyPassword = (password) => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeletePassword = async (passwordId) => {
    if (window.confirm('Are you sure you want to delete this password?')) {
      setLoading(true);
      try {
        const response = await deletePassword(passwordId);
        if (response.success) {
          // Ensure passwords is an array before filtering
          if (Array.isArray(passwords)) {
            setPasswords(passwords.filter(p => p.id !== passwordId));
          }
          // Refetch to ensure data is in sync with the backend
          setTimeout(() => {
            fetchPasswords();
          }, 500);
        } else {
          setError('Failed to delete password: ' + response.error);
        }
      } catch (err) {
        setError('An error occurred while deleting the password.');
        console.error('Delete password error:', err);
      }
      setLoading(false);
    }
  };

  const handleAddEditPassword = async (formData, isEdit = false) => {
    setLoading(true);
    try {
      console.log("Form data received:", formData);

      // Save the password
      let response;
      if (isEdit && selectedPassword) {
        response = await updatePassword(selectedPassword, formData, demoMasterPassword);
      } else {
        response = await addPassword(formData, demoMasterPassword);
      }

      if (response.success) {
        // Format the response with consistent naming
        let updatedPassword;
        if (response.data && response.data.password) {
          updatedPassword = {
            ...response.data.password,
            // Ensure consistent field naming and defaults
            id: response.data.password.id || `temp-${Date.now()}`,
            serviceName: response.data.password.serviceName || response.data.password.name || formData.serviceName || '',
            username: response.data.password.username || formData.username || '',
            website: response.data.password.website || response.data.password.url || formData.website || '',
            lastUpdated: response.data.password.updatedAt || response.data.password.lastUpdated || new Date().toISOString()
          };
        } else if (response.data) {
          // Direct response format
          updatedPassword = {
            ...response.data,
            id: response.data.id || `temp-${Date.now()}`,
            serviceName: response.data.serviceName || response.data.name || formData.serviceName || '',
            username: response.data.username || formData.username || '',
            website: response.data.website || response.data.url || formData.website || '',
            lastUpdated: response.data.updatedAt || response.data.lastUpdated || new Date().toISOString()
          };
        } else {
          // Fallback for when API doesn't return the object
          updatedPassword = {
            ...formData,
            id: `temp-${Date.now()}`,
            serviceName: formData.serviceName || '',
            username: formData.username || '',
            website: formData.website || '',
            lastUpdated: new Date().toISOString()
          };
        }

        if (isEdit) {
          // Update the password in state
          setPasswords(passwords.map(p =>
            p.id === selectedPassword ? updatedPassword : p
          ));
          setIsEditDialogOpen(false);
        } else {
          // Add the new password to state
          setPasswords(prev => [...prev, updatedPassword]);
          setIsAddDialogOpen(false);
        }

        // Refetch to ensure data is in sync with the backend
        setTimeout(() => {
          fetchPasswords();
        }, 500);

        // Success message
        console.log(`Password ${isEdit ? 'updated' : 'added'} successfully!`);
      } else {
        setError(`Failed to ${isEdit ? 'update' : 'add'} password: ${response.error}`);
      }
    } catch (err) {
      setError(`An error occurred while ${isEdit ? 'updating' : 'adding'} the password.`);
      console.error(`${isEdit ? 'Update' : 'Add'} password error:`, err);
    }
    setLoading(false);
  };

  // Ensure passwords is always an array
  const passwordsArray = Array.isArray(passwords) ? passwords : [];

  // Filter passwords based on search query
  const filteredPasswords = passwordsArray.filter(password => {
    if (!password || typeof password !== 'object') return false;

    // Handle potentially undefined values safely
    const serviceName = (password.serviceName || '').toLowerCase();
    const username = (password.username || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return !searchQuery || serviceName.includes(query) || username.includes(query);
  });

  // Sort passwords
  const sortedPasswords = [...filteredPasswords].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';

    if (sortDirection === 'asc') {
      return String(aValue).localeCompare(String(bValue));
    } else {
      return String(bValue).localeCompare(String(aValue));
    }
  });

  return (
    <div className="w-full p-2 sm:p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Password Manager</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Securely store and manage your passwords</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3 flex-1 md:flex-auto"
            onClick={() => {
              setFormMode('generator');
              setIsAddDialogOpen(true);
            }}
          >
            <RefreshCcw size={14} className="sm:hidden" />
            <RefreshCcw size={16} className="hidden sm:block" />
            <span className="sm:inline">Generate Password</span>
            <span className="sm:hidden">Generate</span>
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3 flex-1 md:flex-auto"
            onClick={() => {
              setFormMode('add');
              setIsAddDialogOpen(true);
            }}
          >
            <Plus size={14} className="sm:hidden" />
            <Plus size={16} className="hidden sm:block" />
            <span className="sm:inline">Add Password</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search passwords..."
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-700 rounded-md text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Password list */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-4 sm:mb-6">
        {/* Mobile view - Card layout */}
        <div className="sm:hidden">
          {loading && passwords.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-indigo-500 mr-2"></div>
                Loading passwords...
              </div>
            </div>
          ) : sortedPasswords.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchQuery ? 'No passwords match your search.' : 'No passwords yet.'}
            </div>
          ) : (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Sort by:
                </div>
                <div className="flex space-x-2">
                  <button
                    className={`text-xs px-2 py-1 rounded ${sortField === 'serviceName' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
                    onClick={() => handleSort('serviceName')}
                  >
                    Service {sortField === 'serviceName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    className={`text-xs px-2 py-1 rounded ${sortField === 'username' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
                    onClick={() => handleSort('username')}
                  >
                    Username {sortField === 'username' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              </div>
              {sortedPasswords.map(password => (
                <div key={password.id} className="border-b border-gray-200 p-3">
                  <div className="flex items-center mb-2">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500 mr-3">
                      <Lock size={16} />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{password.serviceName}</div>
                      <div className="text-xs text-gray-500">{password.username}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Updated: {new Date(password.lastUpdated).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-indigo-600"
                        onClick={() => handleViewPasswordDetails(password.id)}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600"
                        onClick={() => {
                          setFormMode('edit');
                          setSelectedPassword(password.id);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600"
                        onClick={() => handleDeletePassword(password.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop view - Table layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('serviceName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Service</span>
                    {sortField === 'serviceName' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Username</span>
                    {sortField === 'username' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('lastUpdated')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Updated</span>
                    {sortField === 'lastUpdated' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && passwords.length === 0 ? (
                <tr key="loading">
                  <td colSpan="4" className="px-4 sm:px-6 py-3 sm:py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-indigo-500 mr-2"></div>
                      Loading passwords...
                    </div>
                  </td>
                </tr>
              ) : sortedPasswords.length === 0 ? (
                <tr key="empty">
                  <td colSpan="4" className="px-4 sm:px-6 py-3 sm:py-4 text-center text-sm text-gray-500">
                    {searchQuery ? 'No passwords match your search.' : 'No passwords yet.'}
                  </td>
                </tr>
              ) : (
                sortedPasswords.map(password => (
                  <tr key={password.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500">
                          <Lock size={16} className="sm:hidden" />
                          <Lock size={18} className="hidden sm:block" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{password.serviceName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-700">{password.username}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-500">
                        {new Date(password.lastUpdated).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1 sm:space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-indigo-600 hover:text-indigo-800 h-7 w-7 sm:h-8 sm:w-8 p-0"
                          onClick={() => handleViewPasswordDetails(password.id)}
                        >
                          <Eye size={14} className="sm:hidden" />
                          <Eye size={16} className="hidden sm:block" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 h-7 w-7 sm:h-8 sm:w-8 p-0"
                          onClick={() => {
                            setFormMode('edit');
                            setSelectedPassword(password.id);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit size={14} className="sm:hidden" />
                          <Edit size={16} className="hidden sm:block" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 h-7 w-7 sm:h-8 sm:w-8 p-0"
                          onClick={() => handleDeletePassword(password.id)}
                        >
                          <Trash2 size={14} className="sm:hidden" />
                          <Trash2 size={16} className="hidden sm:block" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password security tips */}
      <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg border border-indigo-200 mb-4 sm:mb-6">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <AlertTriangle className="text-indigo-600 h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-indigo-800 text-sm sm:text-base">Password Security Tips</h3>
            <ul className="text-xs sm:text-sm text-indigo-700 mt-1 sm:mt-2 list-disc pl-4 sm:pl-5">
              <li>Use a unique password for each account</li>
              <li>Include uppercase, lowercase, numbers, and special characters</li>
              <li className="hidden sm:list-item">Make passwords at least 12 characters long</li>
              <li className="hidden sm:list-item">Avoid using personal information in your passwords</li>
              <li className="hidden sm:list-item">Change your passwords regularly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* View Password Dialog */}
      <AnimatedModal
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        animationType="zoom"
        className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">View Password Details</h2>
          <p className="text-gray-600 mb-4">View your encrypted password details</p>

          {passwordDetails ? (
            <div className="py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Service</Label>
                  <div className="font-medium">{passwordDetails.serviceName}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Username</Label>
                  <div className="font-medium">{passwordDetails.username}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Password</Label>
                  <div className="flex items-center space-x-2">
                    <div className="font-mono bg-gray-100 py-1 px-3 rounded flex-grow">
                      {revealedPasswords[passwordDetails.id] ?
                        passwordDetails.password :
                        '••••••••••••••'
                      }
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevealedPasswords({
                        ...revealedPasswords,
                        [passwordDetails.id]: !revealedPasswords[passwordDetails.id]
                      })}
                    >
                      {revealedPasswords[passwordDetails.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyPassword(passwordDetails.password)}
                      className={copied ? 'text-green-600' : ''}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
                {passwordDetails.notes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Notes</Label>
                    <div className="text-sm bg-gray-50 p-3 rounded">{passwordDetails.notes}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="text-center mb-4">
                <Key className="h-12 w-12 text-indigo-500 mx-auto" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Master Password Required</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your master password to view the encrypted password details
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="masterPassword">Master Password</Label>
                  <Input
                    id="masterPassword"
                    type="password"
                    placeholder="Enter master password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    For demo purposes, use: correct-master-password
                  </p>
                </div>
                <Button
                  className="w-full"
                  disabled={loading || !masterPassword}
                  onClick={handlePasswordReveal}
                >
                  {loading ? 'Decrypting...' : 'View Password'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </AnimatedModal>

      {/* Add/Generate Password Dialog */}
      <AnimatedModal
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        animationType="zoom"
        className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {formMode === 'generator' ? 'Password Generator' : 'Add New Password'}
          </h2>
          <p className="text-gray-600 mb-4">
            {formMode === 'generator' ? 'Generate a secure random password' : 'Add a new password to your vault'}
          </p>

          <Tabs value={formMode === 'generator' ? 'generator' : 'manual'} className="pt-2" defaultValue="manual">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger
                value="manual"
                onClick={() => setFormMode('add')}
              >
                Manual Entry
              </TabsTrigger>
              <TabsTrigger
                value="generator"
                onClick={() => setFormMode('generator')}
              >
                Generate Password
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="py-4">
            <AddEditPasswordComponent
              onSubmit={(formData) => handleAddEditPassword(formData, false)}
              onClose={() => setIsAddDialogOpen(false)}
              loading={loading}
              generatedPassword={generatedPassword}
            />
            </TabsContent>
            <TabsContent value="generator" className="py-4">
              <PasswordGeneratorComponent
                onPasswordGenerated={(password) => {
                  console.log("Password generated:", password);
                  setGeneratedPassword(password);
                }}
                onUsePassword={(password) => {
                  console.log("Password use requested:", password);
                  // Set the generated password first
                  setGeneratedPassword(password);
                  // Then switch to the manual entry tab
                  setFormMode('add');
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </AnimatedModal>

      {/* Edit Password Dialog */}
      <AnimatedModal
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        animationType="zoom"
        className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Edit Password</h2>
          <p className="text-gray-600 mb-4">Modify your stored password details</p>
          <AddEditPasswordComponent
            onSubmit={(formData) => handleAddEditPassword(formData, true)}
            onClose={() => setIsEditDialogOpen(false)}
            loading={loading}
            passwordData={Array.isArray(passwords) ?
              passwords.find(p => p.id === selectedPassword) :
              null}
            isEdit={true}
          />
        </div>
      </AnimatedModal>
    </div>
  );
};

export default PasswordListPage;
