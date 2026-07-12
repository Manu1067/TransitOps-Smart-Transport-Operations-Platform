// client/src/pages/drivers/DriverList.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import Table from "../../components/common/Table";
import StatusBadge from "../../components/common/StatusBadge";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function DriverList() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    status: "",
    category: "",
  });

  useEffect(() => {
    fetchDrivers();
  }, [filters]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE}/drivers`, {
        params: filters,
      });

      setDrivers(res.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load drivers.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this driver?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/drivers/${id}`);
      fetchDrivers();
    } catch (err) {
      console.error(err);
      alert("Unable to delete driver.");
    }
  };

  const columns = [
    {
      header: "Name",
      accessor: "name",
    },
    {
      header: "License Number",
      accessor: "license_number",
    },
    {
      header: "Category",
      accessor: "license_category",
    },
    {
      header: "Expiry",
      accessor: "license_expiry",
      Cell: ({ value }) =>
        value
          ? new Date(value).toLocaleDateString()
          : "-",
    },
    {
      header: "Contact",
      accessor: "contact",
    },
    {
      header: "Safety Score",
      accessor: "safety_score",
      Cell: ({ value }) => (
        <span
          className={`font-semibold ${
            value >= 90
              ? "text-green-600"
              : value >= 70
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {value ?? 0}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      Cell: ({ value }) => (
        <StatusBadge status={value} />
      ),
    },
    {
      header: "Actions",
      accessor: "_id",
      Cell: ({ row }) => (
        <div className="flex gap-2">
          <Link
            to={`/drivers/${row._id}`}
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            View
          </Link>

          <Link
            to={`/drivers/edit/${row._id}`}
            className="px-3 py-1 rounded bg-amber-500 text-white text-sm hover:bg-amber-600"
          >
            Edit
          </Link>

          <button
            onClick={() => handleDelete(row._id)}
            className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Drivers
          </h1>
          <p className="text-gray-500">
            Manage drivers and license information
          </p>
        </div>

        <Link
          to="/drivers/create"
          className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          + Create Driver
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <select
            className="border rounded-lg px-3 py-2"
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value,
              })
            }
          >
            <option value="">All Status</option>
            <option>Active</option>
            <option>On Duty</option>
            <option>Off Duty</option>
            <option>Suspended</option>
            <option>Inactive</option>
          </select>

          <select
            className="border rounded-lg px-3 py-2"
            value={filters.category}
            onChange={(e) =>
              setFilters({
                ...filters,
                category: e.target.value,
              })
            }
          >
            <option value="">All License Categories</option>
            <option>LMV</option>
            <option>HMV</option>
            <option>MCWG</option>
            <option>Transport</option>
          </select>

        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 rounded-lg p-3 mb-5">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading drivers...
          </div>
        ) : (
          <Table
            columns={columns}
            data={drivers}
            emptyMessage="No drivers found."
          />
        )}

      </div>

    </div>
  );
}