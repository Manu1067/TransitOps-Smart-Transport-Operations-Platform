// client/src/pages/maintenance/MaintenanceList.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Plus, Wrench, CheckCircle } from "lucide-react";

const API_URL = "http://localhost:5000/api/maintenance";

const MaintenanceList = () => {
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenanceLogs();
  }, []);

  const fetchMaintenanceLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setMaintenanceLogs(res.data || []);
    } catch (err) {
      console.error("Error fetching maintenance logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMaintenance = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to close this maintenance record?"
    );

    if (!confirm) return;

    try {
      await axios.patch(`${API_URL}/${id}/close`);
      fetchMaintenanceLogs();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Unable to close maintenance."
      );
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const value = status?.toLowerCase();

    if (value === "active") {
      return (
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
          Active
        </span>
      );
    }

    if (value === "closed") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Closed
        </span>
      );
    }

    return (
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Maintenance Logs
            </h1>
            <p className="text-sm text-gray-500">
              Manage vehicle maintenance records.
            </p>
          </div>
        </div>

        <Link
          to="/maintenance/create"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Maintenance
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                Vehicle
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                Maintenance Type / Title
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                Description
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                Cost
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                Opened Date
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                Closed Date
              </th>
              <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="8"
                  className="py-10 text-center text-gray-500"
                >
                  Loading maintenance logs...
                </td>
              </tr>
            ) : maintenanceLogs.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="py-10 text-center text-gray-500"
                >
                  No maintenance records found.
                </td>
              </tr>
            ) : (
              maintenanceLogs.map((log) => (
                <tr
                  key={log._id}
                  className="border-t transition hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    {log.vehicle?.vehicleNumber ||
                      log.vehicle?.registrationNumber ||
                      log.vehicle?.name ||
                      "-"}
                  </td>

                  <td className="px-5 py-4">
                    {log.title ||
                      log.maintenanceType ||
                      log.type ||
                      "-"}
                  </td>

                  <td className="max-w-xs truncate px-5 py-4">
                    {log.description || "-"}
                  </td>

                  <td className="px-5 py-4">
                    ₹{Number(log.cost || 0).toLocaleString()}
                  </td>

                  <td className="px-5 py-4">
                    {getStatusBadge(log.status)}
                  </td>

                  <td className="px-5 py-4">
                    {formatDate(
                      log.openedDate ||
                        log.opened_at ||
                        log.createdAt
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {formatDate(
                      log.closedDate ||
                        log.closed_at
                    )}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <Link
                        to={`/maintenance/${log._id}`}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        View
                      </Link>

                      {log.status?.toLowerCase() ===
                        "active" && (
                        <button
                          onClick={() =>
                            handleCloseMaintenance(
                              log._id
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                        >
                          <CheckCircle size={16} />
                          Close
                        </button>
                      )}
                    </div>
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

export default MaintenanceList;