"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useCustomerStore } from '@/lib/stores/customerStore';
// Assuming Customer type is imported from here
import type { Customer } from '@/lib/types';
// Assuming UpdateCustomerInput is defined or imported if needed,
// otherwise use Partial<Customer> or a specific creation type.

// Define the type for creating a customer (matching the store action input)
type CreateCustomerInput = Omit<Customer, 'id' | 'purchaseOrders'>; // Or just Omit<Customer, 'id'>

export default function CustomerStoreTestPage() {
  // Get state and actions from the store
  const {
    customers,
    selectedCustomer,
    loading,
    error,
    fetchCustomers,
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomerStore();

  // Local state for form inputs
  const [customerIdInput, setCustomerIdInput] = useState<string>('');

  // --- Use the correct type for new customer data ---
  const [newCustomerData, setNewCustomerData] = useState<CreateCustomerInput>({
    // Initialize based on CreateCustomerInput type
    // Assuming these fields are part of Customer and thus CreateCustomerInput
    businessAddress1:'',
    businessAddress2: '',
    businessAddressCity: '',
    businessAddressCountry: '',
    businessAddressState: '',
    businessAddressZip: '',
    contactEmail: '',
    contactName: '',
    contactPhone : '',
    businessName: '',

    // Add other required fields from CreateCustomerInput, initializing them
  });
  // --- End type change ---

  // Assuming UpdateCustomerInput is similar to Partial<Customer>
  const [updateCustomerData, setUpdateCustomerData] = useState<Partial<Customer>>({});

  // Effect to load selected customer data into the update form
  useEffect(() => {
    if (selectedCustomer) {
      // Pre-fill update form with selected customer's data
      setUpdateCustomerData({
        businessAddress1: selectedCustomer.businessAddress1, // Use 'name' if that's the property
        businessAddress2: selectedCustomer.businessAddress2, // Use 'contactPerson'
        businessAddressCity: selectedCustomer.businessAddressCity,
        businessAddressCountry: selectedCustomer.businessAddressCountry,
        businessAddressState: selectedCustomer.businessAddressState,
        businessAddressZip: selectedCustomer.businessAddressZip,
        businessName: selectedCustomer.businessName,
        contactEmail: selectedCustomer.contactEmail,
        contactName: selectedCustomer.contactName,
        contactPhone: selectedCustomer.contactPhone,
        // Add other updatable fields
      });
    } else {
      setUpdateCustomerData({}); // Clear form if no customer selected
    }
  }, [selectedCustomer]);

  // --- Handlers for form inputs ---
  const handleNewCustomerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateCustomerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdateCustomerData(prev => ({ ...prev, [name]: value }));
  };

  // --- Handlers for form submissions ---
  const handleCreateCustomer = async (e: FormEvent) => {
    e.preventDefault();
    await createCustomer(newCustomerData);
    // Optionally clear form
    setNewCustomerData({
        businessName: '', contactName: '', contactEmail: '', contactPhone: '',
        businessAddress1: '', businessAddress2: '', businessAddressCity: '', businessAddressState: '',
        businessAddressZip: '', businessAddressCountry: ''
        // Reset other fields
    });
  };

  const handleUpdateCustomer = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedCustomer?.id) { // Ensure there's an ID to update
      await updateCustomer(selectedCustomer.id, updateCustomerData);
    } else {
      console.error("No selected customer to update");
      // Handle error: show message to user?
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete customer ${id}?`)) {
      await deleteCustomer(id);
      setCustomerIdInput(''); // Clear input if needed
    }
  };

  // --- Handler to fetch a specific customer ---
   const handleFetchCustomer = () => {
    if (customerIdInput) {
      fetchCustomerById(customerIdInput);
    }
  };


  // Effect to fetch all customers on initial load
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]); // Dependency array ensures it runs once

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Customer Store Test</h1>

      {/* Loading and Error States */}
      {loading && <p className="text-blue-500">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Fetch All Customers Button */}
      <button onClick={fetchCustomers} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Fetch All Customers
      </button>

      {/* Display Customers */}
      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Customers List ({customers.length})</h2>
        <ul className="space-y-1 max-h-60 overflow-y-auto">
          {customers.map((customer) => (
            <li key={customer.id} className="flex justify-between items-center p-1 hover:bg-gray-100">
              <span>{customer.businessName} (ID: {customer.id})</span>
              <div>
                 <button
                  onClick={() => fetchCustomerById(customer.id)} // Fetch details on click
                  className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 mr-1"
                >
                  Select
                </button>
                <button
                  onClick={() => handleDeleteCustomer(customer.id)}
                  className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

       {/* Fetch Customer by ID */}
      <div className="border p-4 rounded space-y-2">
        <h2 className="text-xl font-semibold">Fetch Customer by ID</h2>
        <input
          type="text"
          value={customerIdInput}
          onChange={(e) => setCustomerIdInput(e.target.value)}
          placeholder="Enter Customer ID"
          className="border p-2 rounded w-full"
        />
        <button onClick={handleFetchCustomer} className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600">
          Fetch Customer
        </button>
         {/* Display Selected Customer */}
        {selectedCustomer && (
          <div className="mt-4 p-2 border bg-gray-50 rounded">
            <h3 className="font-semibold">Selected Customer:</h3>
            <pre className="text-sm">{JSON.stringify(selectedCustomer, null, 2)}</pre>
          </div>
        )}
      </div>


      {/* Create Customer Form */}
      <form onSubmit={handleCreateCustomer} className="border p-4 rounded space-y-2">
        <h2 className="text-xl font-semibold">Create New Customer</h2>
        {/* --- Ensure 'name' attribute matches state key --- */}
        <input
          type="text"
          name="businessName" // Correct: Matches newCustomerData.businessName
          value={newCustomerData.businessName}
          onChange={handleNewCustomerChange}
          placeholder="Business Name"
          className="border p-2 rounded w-full"
          required
          disabled={loading}
        />
        <input
          type="text"
          name="contactName" // Correct: Matches newCustomerData.contactName
          value={newCustomerData.contactName}
          onChange={handleNewCustomerChange}
          placeholder="Contact Name"
          className="border p-2 rounded w-full"
          required
          disabled={loading}
        />
        <input
          type="email"
          name="contactEmail" // Correct: Matches newCustomerData.contactEmail
          value={newCustomerData.contactEmail || ''}
          onChange={handleNewCustomerChange}
          placeholder="Contact Email"
          className="border p-2 rounded w-full"
          disabled={loading} // Assuming email might be optional based on || ''
        />
         <input
          type="text"
          name="contactPhone" // Correct: Matches newCustomerData.contactPhone
          value={newCustomerData.contactPhone || ''}
          onChange={handleNewCustomerChange}
          placeholder="Contact Phone"
          className="border p-2 rounded w-full"
          disabled={loading}
        />
         <input
          type="text"
          name="businessAddress1" // Correct
          value={newCustomerData.businessAddress1 || ''}
          onChange={handleNewCustomerChange}
          placeholder="Address 1"
          className="border p-2 rounded w-full"
          disabled={loading}
        />
         <input
          type="text"
          name="businessAddress2" // Correct
          value={newCustomerData.businessAddress2 || ''}
          onChange={handleNewCustomerChange}
          placeholder="Address 2"
          className="border p-2 rounded w-full"
          disabled={loading}
        />
         <input
          type="text"
          name="businessAddressCity" // Correct
          value={newCustomerData.businessAddressCity || ''}
          onChange={handleNewCustomerChange}
          placeholder="City"
          className="border p-2 rounded w-full"
          disabled={loading}
        />
         <input
          type="text"
          name="businessAddressState" // Correct
          value={newCustomerData.businessAddressState || ''}
          onChange={handleNewCustomerChange}
          placeholder="State"
          className="border p-2 rounded w-full"
          disabled={loading}
        />
         <input
          type="text"
          name="businessAddressZip" // Correct
          value={newCustomerData.businessAddressZip || ''}
          onChange={handleNewCustomerChange}
          placeholder="Zip Code"
          className="border p-2 rounded w-full"
          disabled={loading}
        />
         <input
          type="text"
          name="businessAddressCountry" // Correct
          value={newCustomerData.businessAddressCountry || ''}
          onChange={handleNewCustomerChange}
          placeholder="Country"
          className="border p-2 rounded w-full"
          disabled={loading}
        />
        {/* Add other inputs ensuring 'name' matches the key in newCustomerData */}
        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50">
          Create Customer
        </button>
      </form>

      {/* Update Customer Form (only shows if a customer is selected) */}
      {/* --- Apply the same fix here for the Update form --- */}
      {selectedCustomer && (
        <form onSubmit={handleUpdateCustomer} className="border p-4 rounded space-y-2">
          <h2 className="text-xl font-semibold">Update Customer (ID: {selectedCustomer.id})</h2>
          <input
            type="text"
            name="businessName" // Correct: Matches updateCustomerData.businessName
            value={updateCustomerData.businessName || ''}
            onChange={handleUpdateCustomerChange}
            placeholder="Business Name"
            className="border p-2 rounded w-full"
            disabled={loading}
          />
          <input
            type="text"
            name="contactName" // Correct: Matches updateCustomerData.contactName
            value={updateCustomerData.contactName || ''}
            onChange={handleUpdateCustomerChange}
            placeholder="Contact Name"
            className="border p-2 rounded w-full"
            disabled={loading}
          />
          <input
            type="email"
            name="contactEmail" // Correct: Matches updateCustomerData.contactEmail
            value={updateCustomerData.contactEmail || ''}
            onChange={handleUpdateCustomerChange}
            placeholder="Contact Email"
            className="border p-2 rounded w-full"
            disabled={loading}
          />
           <input
            type="text"
            name="contactPhone" // Correct
            value={updateCustomerData.contactPhone || ''}
            onChange={handleUpdateCustomerChange}
            placeholder="Contact Phone"
            className="border p-2 rounded w-full"
            disabled={loading}
          />
           <input
            type="text"
            name="businessAddress1" // Correct
            value={updateCustomerData.businessAddress1 || ''}
            onChange={handleUpdateCustomerChange}
            placeholder="Address 1"
            className="border p-2 rounded w-full"
            disabled={loading}
          />
           <input
            type="text"
            name="businessAddress2" // Correct
            value={updateCustomerData.businessAddress2 || ''}
            onChange={handleUpdateCustomerChange}
            placeholder="Address 2"
            className="border p-2 rounded w-full"
            disabled={loading}
          />
           <input
            type="text"
            name="businessAddressCity" // Correct
            value={updateCustomerData.businessAddressCity || ''}
            onChange={handleUpdateCustomerChange}
            placeholder="City"
            className="border p-2 rounded w-full"
            disabled={loading}
          />
           <input
            type="text"
            name="businessAddressState" // Correct
            value={updateCustomerData.businessAddressState || ''}
            onChange={handleUpdateCustomerChange}
            placeholder="State"
            className="border p-2 rounded w-full"
            disabled={loading}
          />
           <input
            type="text"
            name="businessAddressZip" // Correct
            value={updateCustomerData.businessAddressZip || ''}
            onChange={handleUpdateCustomerChange}
            placeholder="Zip Code"
            className="border p-2 rounded w-full"
            disabled={loading}
          />
           <input
            type="text"
            name="businessAddressCountry" // Correct
            value={updateCustomerData.businessAddressCountry || ''}
            onChange={handleUpdateCustomerChange}
            placeholder="Country"
            className="border p-2 rounded w-full"
            disabled={loading}
          />
          {/* Add other inputs ensuring 'name' matches the key in updateCustomerData */}
          <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50">
            Update Customer
          </button>
        </form>
      )}

    </div>
  );
}