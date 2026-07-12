// client/src/pages/Dashboard.jsx

import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    vehicleType: "",
    status: "",
    region: "",
  });

  useEffect(() => {
    fetchDashboard();
  }, [filters]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE}/dashboard`, {
        params: filters,
      });

      setDashboard(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    {
      title: "Active Vehicles",
      value: dashboard?.activeVehicles ?? "--",
      color: "bg-blue-500",
    },
    {
      title: "Available Vehicles",
      value: dashboard?.availableVehicles ?? "--",
      color: "bg-green-500",
    },
    {
      title: "Vehicles in Maintenance",
      value: dashboard?.maintenanceVehicles ?? "--",
      color: "bg-red-500",
    },
    {
      title: "Active Trips",
      value: dashboard?.activeTrips ?? "--",
      color: "bg-purple-500",
    },
    {
      title: "Pending Trips",
      value: dashboard?.pendingTrips ?? "--",
      color: "bg-yellow-500",
    },
    {
      title: "Drivers On Duty",
      value: dashboard?.driversOnDuty ?? "--",
      color: "bg-indigo-500",
    },
    {
      title: "Fleet Utilization",
      value: `${dashboard?.fleetUtilization ?? 0}%`,
      color: "bg-cyan-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        Loading Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          TransitOps Dashboard
        </h1>
        <p className="text-slate-500">
          Fleet Monitoring & Operations Overview
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="font-semibold mb-4">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="border rounded-lg p-2"
            value={filters.vehicleType}
            onChange={(e) =>
              setFilters({ ...filters, vehicleType: e.target.value })
            }
          >
            <option value="">All Vehicle Types</option>
            <option>Bus</option>
            <option>Truck</option>
            <option>Van</option>
          </select>

          <select
            className="border rounded-lg p-2"
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
          >
            <option value="">All Status</option>
            <option>Active</option>
            <option>Available</option>
            <option>Maintenance</option>
          </select>

          <select
            className="border rounded-lg p-2"
            value={filters.region}
            onChange={(e) =>
              setFilters({ ...filters, region: e.target.value })
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between"
          >
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>
              <h2 className="text-3xl font-bold mt-2">{card.value}</h2>
            </div>

            <div
              className={`w-14 h-14 rounded-full ${card.color} opacity-90`}
            ></div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Fleet Status */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-xl font-semibold mb-4">
            Fleet Status Breakdown
          </h2>

          <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-gray-400">
            Pie Chart Placeholder
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between">
              <span>Available</span>
              <span>{dashboard?.availableVehicles ?? 0}</span>
            </div>

            <div className="flex justify-between">
              <span>Active</span>
              <span>{dashboard?.activeVehicles ?? 0}</span>
            </div>

            <div className="flex justify-between">
              <span>Maintenance</span>
              <span>{dashboard?.maintenanceVehicles ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Trips */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-xl font-semibold mb-4">
            Trip Status Breakdown
          </h2>

          <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-gray-400">
            Bar Chart Placeholder
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between">
              <span>Active Trips</span>
              <span>{dashboard?.activeTrips ?? 0}</span>
            </div>

            <div className="flex justify-between">
              <span>Pending Trips</span>
              <span>{dashboard?.pendingTrips ?? 0}</span>
            </div>

            <div className="flex justify-between">
              <span>Completed Trips</span>
              <span>{dashboard?.completedTrips ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Status */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-xl font-semibold mb-4">
          Driver Status Overview
        </h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-green-100 p-5 text-center">
            <h3 className="text-lg font-semibold">On Duty</h3>
            <p className="text-3xl font-bold mt-2">
              {dashboard?.driversOnDuty ?? 0}
            </p>
          </div>

          <div className="rounded-lg bg-yellow-100 p-5 text-center">
            <h3 className="text-lg font-semibold">Off Duty</h3>
            <p className="text-3xl font-bold mt-2">
              {dashboard?.driversOffDuty ?? 0}
            </p>
          </div>

          <div className="rounded-lg bg-blue-100 p-5 text-center">
            <h3 className="text-lg font-semibold">Total Drivers</h3>
            <p className="text-3xl font-bold mt-2">
              {dashboard?.totalDrivers ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}