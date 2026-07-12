// client/src/pages/fuel-expenses/FuelLogList.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Plus, Trash2, Fuel } from "lucide-react";

const API_URL = "http://localhost:5000/api/fuel-logs";

const FuelLogList = () => {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchFuelLogs();
  }, []);

  const fetchFuelLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setFuelLogs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch fuel logs:", err);
      alert(
        err.response?.data?.message || "Unable to load fuel logs."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this fuel log?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await axios.delete(`${API_URL}/${id}`);

      setFuelLogs((prev) => prev.filter((log) => log._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert(
        err.response?.data?.message ||
          "Failed to delete fuel log."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : "-";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Fuel className="h-7 w-7 text-blue-600" />

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Fuel Logs
            </h1>
            <p className="text-sm text-gray-500">
              Track vehicle fuel expenses.
            </p>
          </div>
        </div>

        <Link
          to="/fuel-expenses/create"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Fuel Log
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Liters
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Odometer
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-gray-500"
                >
                  Loading fuel logs...
                </td>
              </tr>
            ) : fuelLogs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-gray-500"
                >
                  No fuel logs found.
                </td>
              </tr>
            ) : (
              fuelLogs.map((log) => (
                <tr
                  key={log._id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    {log.vehicle?.vehicleNumber ||
                      log.vehicle?.registrationNumber ||
                      log.vehicle?.name ||
                      "-"}
                  </td>

                  <td className="px-6 py-4">
                    {log.liters} L
                  </td>

                  <td className="px-6 py-4">
                    {formatCurrency(log.cost)}
                  </td>

                  <td className="px-6 py-4">
                    {formatDate(log.date)}
                  </td>

                  <td className="px-6 py-4">
                    {log.odometer?.toLocaleString() || "-"} km
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(log._id)}
                      disabled={deletingId === log._id}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={16} />
                      {deletingId === log._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FuelLogList;