// client/src/pages/drivers/DriverDetail.jsx

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function DriverDetail() {
  const { id } = useParams();

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDriver();
  }, [id]);

  const fetchDriver = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE}/drivers/${id}`);

      setDriver(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load driver details.");
    } finally {
      setLoading(false);
    }
  };

  const getLicenseStatus = () => {
    if (!driver?.license_expiry_date) {
      return {
        label: "Unknown",
        color: "bg-gray-100 text-gray-700",
      };
    }

    const today = new Date();
    const expiry = new Date(driver.license_expiry_date);

    const diffDays = Math.ceil(
      (expiry - today) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return {
        label: "Expired",
        color: "bg-red-100 text-red-700",
      };
    }

    if (diffDays <= 30) {
      return {
        label: `Expires in ${diffDays} days`,
        color: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      label: "Valid",
      color: "bg-green-100 text-green-700",
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        Loading driver details...
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

  const licenseStatus = getLicenseStatus();

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-6xl mx-auto">

        {/* Header */}

        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">

          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Driver Profile
            </h1>

            <p className="text-slate-500">
              Complete driver information
            </p>
          </div>

          <Link
            to={`/drivers/edit/${driver._id}`}
            className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            Edit Driver
          </Link>

        </div>

        {/* Profile */}

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">

          <div className="grid md:grid-cols-2 gap-6">

            <Info
              title="Driver Name"
              value={driver.name}
            />

            <Info
              title="License Number"
              value={driver.license_number}
            />

            <Info
              title="License Category"
              value={driver.license_category}
            />

            <Info
              title="Contact Number"
              value={driver.contact_number}
            />

            <Info
              title="Region"
              value={driver.region}
            />

            <Info
              title="Status"
              value={
                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  {driver.status}
                </span>
              }
            />

            <Info
              title="Safety Score"
              value={
                <span
                  className={`font-bold ${
                    driver.safety_score >= 90
                      ? "text-green-600"
                      : driver.safety_score >= 70
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {driver.safety_score}/100
                </span>
              }
            />

            <Info
              title="License Expiry"
              value={
                <div>
                  <p>
                    {new Date(
                      driver.license_expiry_date
                    ).toLocaleDateString()}
                  </p>

                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${licenseStatus.color}`}
                  >
                    {licenseStatus.label}
                  </span>
                </div>
              }
            />

          </div>

        </div>

        {/* Recent Trips */}

        <div className="bg-white rounded-xl shadow-lg p-8">

          <h2 className="text-2xl font-semibold mb-5">
            Recent Trips
          </h2>

          {driver.recentTrips &&
          driver.recentTrips.length > 0 ? (

            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-slate-100">

                  <tr>

                    <th className="px-4 py-3 text-left">
                      Trip ID
                    </th>

                    <th className="px-4 py-3 text-left">
                      Vehicle
                    </th>

                    <th className="px-4 py-3 text-left">
                      Route
                    </th>

                    <th className="px-4 py-3 text-left">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {driver.recentTrips.map((trip) => (

                    <tr
                      key={trip._id}
                      className="border-b"
                    >
                      <td className="px-4 py-3">
                        {trip.trip_number || trip._id}
                      </td>

                      <td className="px-4 py-3">
                        {trip.vehicle_name}
                      </td>

                      <td className="px-4 py-3">
                        {trip.origin} → {trip.destination}
                      </td>

                      <td className="px-4 py-3">
                        {new Date(
                          trip.date
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                          {trip.status}
                        </span>
                      </td>
                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          ) : (

            <div className="text-center py-12 text-slate-500">
              No recent trips available.
            </div>

          )}

        </div>

      </div>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div className="border rounded-lg p-4">

      <p className="text-sm text-slate-500 mb-1">
        {title}
      </p>

      <div className="text-lg font-medium text-slate-800">
        {value}
      </div>

    </div>
  );
}