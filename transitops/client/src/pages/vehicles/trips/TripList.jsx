// client/src/pages/trips/TripList.jsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Plus } from "lucide-react";

import Table from "../../components/common/Table";
import StatusBadge from "../../components/common/StatusBadge";

const API_URL = "http://localhost:5000/api/trips";

const TripList = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: "",
    vehicle: "",
    driver: "",
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setTrips(res.data || []);
    } catch (err) {
      console.error("Error fetching trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const statusMatch =
        !filters.status ||
        trip.status?.toLowerCase() === filters.status.toLowerCase();

      const vehicleMatch =
        !filters.vehicle ||
        trip.vehicle?.vehicleNumber
          ?.toLowerCase()
          .includes(filters.vehicle.toLowerCase()) ||
        trip.vehicle?.registrationNumber
          ?.toLowerCase()
          .includes(filters.vehicle.toLowerCase());

      const driverMatch =
        !filters.driver ||
        trip.driver?.name
          ?.toLowerCase()
          .includes(filters.driver.toLowerCase());

      return statusMatch && vehicleMatch && driverMatch;
    });
  }, [trips, filters]);

  const columns = [
    {
      header: "Source",
      accessor: "source",
      cell: (row) => row.source || "-",
    },
    {
      header: "Destination",
      accessor: "destination",
      cell: (row) => row.destination || "-",
    },
    {
      header: "Vehicle",
      accessor: "vehicle",
      cell: (row) =>
        row.vehicle?.vehicleNumber ||
        row.vehicle?.registrationNumber ||
        "-",
    },
    {
      header: "Driver",
      accessor: "driver",
      cell: (row) => row.driver?.name || "-",
    },
    {
      header: "Cargo Weight",
      accessor: "cargoWeight",
      cell: (row) =>
        row.cargoWeight ? `${row.cargoWeight} kg` : "-",
    },
    {
      header: "Planned Distance",
      accessor: "plannedDistance",
      cell: (row) =>
        row.plannedDistance ? `${row.plannedDistance} km` : "-",
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Link
            to={`/trips/${row._id}`}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            View
          </Link>

          <Link
            to={`/trips/edit/${row._id}`}
            className="rounded-md bg-amber-500 px-3 py-1 text-sm text-white hover:bg-amber-600"
          >
            Edit
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Trip Management
          </h1>
          <p className="text-sm text-gray-500">
            View and manage transport trips.
          </p>
        </div>

        <Link
          to="/trips/create"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Trip
        </Link>
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-xl bg-white p-4 shadow md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="planned">Planned</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Vehicle
          </label>

          <input
            type="text"
            placeholder="Search vehicle..."
            value={filters.vehicle}
            onChange={(e) =>
              setFilters({ ...filters, vehicle: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Driver
          </label>

          <input
            type="text"
            placeholder="Search driver..."
            value={filters.driver}
            onChange={(e) =>
              setFilters({ ...filters, driver: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow">
        <Table
          columns={columns}
          data={filteredTrips}
          loading={loading}
          emptyMessage="No trips found."
        />
      </div>
    </div>
  );
};

export default TripList;