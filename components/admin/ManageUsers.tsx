"use client";

import React, { useEffect, useState } from "react";
import { getUsersAction, updateUserStatusAction } from "@/app/admin/actions";
import Modal from "./Modal"; // Ensure you import the Modal component

interface User {
  $id: string;
  userId: string; // Appwrite User ID
  accountType: "student" | "teacher" | "admin";
  isDisabled: boolean;
  email: string; // Assuming email is part of your user profile document
  name?: string; // Assuming name is part of your user profile document
}

interface ManageUsersProps {
  showModal: (title: string, message: string) => void;
}

export default function ManageUsers({ showModal }: ManageUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"disable" | "enable" | null>(
    null
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getUsersAction();
      setUsers(fetchedUsers || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users.");
      showModal("Error", err.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChangeClick = (user: User, type: "disable" | "enable") => {
    setSelectedUser(user);
    setActionType(type);
    setIsConfirmModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedUser || !actionType) return;

    setIsConfirmModalOpen(false);
    setLoading(true); // Show loading state for the action

    try {
      await updateUserStatusAction(selectedUser.$id, actionType === "disable");
      showModal(
        "Success",
        `User ${selectedUser.name || selectedUser.email} has been ${
          actionType === "disable" ? "disabled" : "enabled"
        }.`
      );
      // Refresh the user list after action
      await fetchUsers();
    } catch (err: any) {
      showModal("Error", err.message || `Failed to ${actionType} user.`);
    } finally {
      setLoading(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="ml-4 text-lg text-gray-600">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center p-4">{error}</div>;
  }

  if (users.length === 0) {
    return (
      <div className="text-gray-600 text-center p-4">
        No student or teacher accounts found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name / Email
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Account Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.$id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {user.name || user.email || user.userId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                {user.accountType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isDisabled
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.isDisabled ? "Disabled" : "Active"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {user.isDisabled ? (
                  <button
                    onClick={() => handleStatusChangeClick(user, "enable")}
                    className="text-green-600 hover:text-green-900 transition-colors duration-200"
                  >
                    Enable
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChangeClick(user, "disable")}
                    className="text-red-600 hover:text-red-900 transition-colors duration-200"
                  >
                    Disable
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={`${actionType === "disable" ? "Disable" : "Enable"} Account`}
      >
        <p className="text-gray-700 mb-4">
          Are you sure you want to {actionType} the account for{" "}
          <span className="font-semibold">
            {selectedUser?.name || selectedUser?.email || selectedUser?.userId}
          </span>
          ?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsConfirmModalOpen(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={confirmStatusChange}
            className={`px-4 py-2 rounded-md transition-colors duration-200 ${
              actionType === "disable"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {actionType === "disable" ? "Disable" : "Enable"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
