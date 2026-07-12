// client/src/pages/fuel-expenses/FuelLogForm.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const VEHICLES_API = "http://localhost:5000/api/vehicles";
const FUEL_API = "http://localhost:5000/api/fuel-logs";

const FuelLogForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState([]);

  const [formData, setFormData] = useState({
    vehicle_id: "",
    liters: "",
    cost: "",
    date: new Date().toISOString().split("T")[0],
    odometer: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const vehicleReq = axios.get(VEHICLES_API);

      const requests = [vehicleReq];

      if (isEdit) {
        requests.push(axios.get(`${FUEL_API}/${id}`));
      }

      const responses = await Promise.all(requests);

      setVehicles(responses[0].data || []);

      if (isEdit) {
        const fuel = responses[1].data;

        setFormData({
          vehicle_id: fuel.vehicle?._id || fuel.vehicle_id || "",
          liters: fuel.liters ?? "",
          cost: fuel.cost ?? "",
          date: fuel.date
            ? new Date(fuel.date).toISOString().split("T")[0]
            : "",
          odometer: fuel.odometer ?? "",
        });
      }
    } catch (err) {
      console.error(err);
      setErrors([
        err.response?.data?.message ||
          "Failed to load required data.",
      ]);
    } finally {
      setLoading(false);
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
    const validationErrors = [];

    if (!formData.vehicle_id)
      validationErrors.push("Vehicle is required.");

    if (Number(formData.liters) < 0)
      validationErrors.push("Liters cannot be negative.");

    if (Number(formData.cost) < 0)
      validationErrors.push("Cost cannot be negative.");

    if (Number(formData.odometer) < 0)
      validationErrors.push("Odometer cannot be negative.");

    if (!formData.date)
      validationErrors.push("Date is required.");

    if (validationErrors.length) {
      setErrors(validationErrors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      vehicle_id: formData.vehicle_id,
      liters: Number(formData.liters),
      cost: Number(formData.cost),
      date: formData.date,
      odometer: Number(formData.odometer),
    };

    try {
      setSaving(true);
      setErrors([]);

      if (isEdit) {
        await axios.put(`${FUEL_API}/${id}`, payload);
      } else {
        await axios.post(FUEL_API, payload);
      }

      navigate("/fuel-expenses");
    } catch (err) {
      console.error(err);

      if (err.response?.data?.errors) {
        setErrors(
          err.response.data.errors.map(
            (e) => e.msg || e.message || String(e)
          )
        );
      } else {
        setErrors([
          err.response?.data?.message ||
            "Failed to save fuel log.",
        ]);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10 text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-xl bg-white shadow-lg">
        <div className="border-b px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? "Edit Fuel Log" : "Add Fuel Log"}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Record fuel consumption for a vehicle.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="mx-8 mt-6 rounded-lg border border-red-300 bg-red-50 p-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-8"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Vehicle
            </label>

            <select
              name="vehicle_id"
              value={formData.vehicle_id}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select Vehicle</option>

              {vehicles.map((vehicle) => (
                <option
                  key={vehicle._id}
                  value={vehicle._id}
                >
                  {vehicle.vehicleNumber ||
                    vehicle.registrationNumber}
                  {vehicle.model
                    ? ` • ${vehicle.model}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Liters
              </label>

              <input
                type="number"
                name="liters"
                value={formData.liters}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

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
                Date
              </label>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Odometer
              </label>

              <input
                type="number"
                name="odometer"
                value={formData.odometer}
                onChange={handleChange}
                min="0"
                step="1"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={() => navigate("/fuel-expenses")}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                ? "Update Fuel Log"
                : "Create Fuel Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelLogForm;