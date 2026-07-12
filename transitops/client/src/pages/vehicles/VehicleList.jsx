// client/src/pages/vehicles/VehicleList.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import Table from "../../components/common/Table";
import StatusBadge from "../../components/common/StatusBadge";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    type: "",
    status: "",
    region: "",
  });

  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE}/vehicles`, {
        params: filters,
      });

      setVehicles(res.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch vehicles.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this vehicle?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      console.error(err);
      alert("Unable to delete vehicle.");
    }
  };

  const columns = [
    {
      header: "Registration Number",
      accessor: "registrationNumber",
    },
    {
      header: "Name / Model",
      accessor: "name",
      Cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-gray-500">{row.model}</p>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "type",
    },
    {
      header: "Max Load Capacity",
      accessor: "maxLoadCapacity",
      Cell: ({ value }) => `${value} kg`,
    },
    {
      header: "Odometer",
      accessor: "odometer",
      Cell: ({ value }) => `${value.toLocaleString()} km`,
    },
    {
      header: "Acquisition Cost",
      accessor: "acquisitionCost",
      Cell: ({ value }) =>
        `₹${Number(value).toLocaleString("en-IN")}`,
    },
    {
      header: "Status",
      accessor: "status",
      Cell: ({ value }) => <StatusBadge status={value} />,
    },
    {
      header: "Actions",
      accessor: "_id",
      Cell: ({ row }) => (
        <div className="flex gap-2">
          <Link
            to={`/vehicles/${row._id}`}
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            View
          </Link>

          <Link
            to={`/vehicles/edit/${row._id}`}
            className="px-3 py-1 rounded bg-yellow-500 text-white text-sm hover:bg-yellow-600"
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
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Vehicles
          </h1>
          <p className="text-gray-500">
            Manage your transport fleet
          </p>
        </div>

        <Link
          to="/vehicles/create"
          className="mt-4 md:mt-0 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create Vehicle
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="grid md:grid-cols-3 gap-4">

          <select
            className="border rounded-lg p-2"
            value={filters.type}
            onChange={(e) =>
              setFilters({
                ...filters,
                type: e.target.value,
              })
            }
          >
            <option value="">All Types</option>
            <option>Bus</option>
            <option>Truck</option>
            <option>Van</option>
            <option>Car</option>
          </select>

          <select
            className="border rounded-lg p-2"
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value,
              })
            }
          >
            <option value="">All Status</option>
            <option>Available</option>
            <option>Active</option>
            <option>Maintenance</option>
            <option>Inactive</option>
          </select>

          <select
            className="border rounded-lg p-2"
            value={filters.region}
            onChange={(e) =>
              setFilters({
                ...filters,
                region: e.target.value,
              })
            }
          >
            <option value="">All Regions</option>
            <option>North</option>
            <option>South</option>
            <option>East</option>
            <option>West</option>
          </select>

        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading vehicles...
          </div>
        ) : (
          <Table
            columns={columns}
            data={vehicles}
            emptyMessage="No vehicles found."
          />
        )}

      </div>
    </div>
  );
}