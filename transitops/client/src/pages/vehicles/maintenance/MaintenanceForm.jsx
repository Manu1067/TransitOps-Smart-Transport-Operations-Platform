// client/src/pages/maintenance/MaintenanceForm.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, Wrench } from "lucide-react";

const VEHICLES_API = "http://localhost:5000/api/vehicles/eligible-maintenance";
const MAINTENANCE_API = "http://localhost:5000/api/maintenance";

const MaintenanceForm = () => {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState([]);

  const [formData, setFormData] = useState({
    vehicle_id: "",
    title: "",
    description: "",
    cost: "",
    opened_at: new Date().toISOString().split("T")[0],
    status: "Active",
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);

      const res = await axios.get(VEHICLES_API);

      setVehicles(res.data || []);
    } catch (err) {
      console.error(err);
      setErrors([
        "Unable to load eligible vehicles. Please refresh the page.",
      ]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleChange = (e) => {
    setErrors([]);

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validate = () => {
    if (!formData.vehicle_id) {
      setErrors(["Please select a vehicle."]);
      return false;
    }

    if (!formData.title.trim()) {
      setErrors(["Maintenance title is required."]);
      return false;
    }

    if (Number(formData.cost) < 0) {
      setErrors(["Cost cannot be negative."]);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      setErrors([]);

      await axios.post(MAINTENANCE_API, {
        vehicle_id: formData.vehicle_id,
        title: formData.title,
        description: formData.description,
        cost: Number(formData.cost),
        opened_at: formData.opened_at,
        status: formData.status,
      });

      navigate("/maintenance");
    } catch (err) {
      console.error(err);

      if (err.response?.data?.errors) {
        setErrors(
          err.response.data.errors.map((e) => e.msg || e.message || e)
        );
      } else if (err.response?.data?.message) {
        setErrors([err.response.data.message]);
      } else {
        setErrors(["Failed to create maintenance log."]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-xl bg-white shadow-lg">
        {/* Header */}
        <div className="border-b px-8 py-6">
          <div className="flex items-center gap-3">
            <Wrench className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Create Maintenance Log
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Register a new maintenance record for a vehicle.
              </p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mx-8 mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 text-amber-600" />

            <div>
              <h3 className="font-semibold text-amber-800">
                Vehicle Status Warning
              </h3>

              <p className="mt-1 text-sm text-amber-700">
                Creating an <strong>Active</strong> maintenance record will
                automatically move the selected vehicle to
                <span className="font-semibold"> "In Shop"</span> status,
                making it unavailable for dispatch until maintenance is closed.
              </p>
            </div>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mx-8 mt-6 rounded-lg border border-red-300 bg-red-50 p-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
              {errors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-8"
        >
          {/* Vehicle */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Vehicle
            </label>

            <select
              name="vehicle_id"
              value={formData.vehicle_id}
              onChange={handleChange}
              disabled={loadingVehicles}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">
                {loadingVehicles
                  ? "Loading vehicles..."
                  : "Select Vehicle"}
              </option>

              {vehicles.map((vehicle) => (
                <option
                  key={vehicle._id}
                  value={vehicle._id}
                >
                  {vehicle.vehicleNumber ||
                    vehicle.registrationNumber}{" "}
                  {vehicle.model ? `• ${vehicle.model}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Maintenance Title
            </label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Engine Service"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the maintenance work..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Cost & Date */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cost (₹)
              </label>

              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Opened Date
              </label>

              <input
                type="date"
                name="opened_at"
                value={formData.opened_at}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>

            <input
              type="text"
              value="Active"
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-gray-600"
            />

            <p className="mt-2 text-xs text-gray-500">
              New maintenance records always start as{" "}
              <strong>Active</strong>.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={() => navigate("/maintenance")}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Maintenance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;