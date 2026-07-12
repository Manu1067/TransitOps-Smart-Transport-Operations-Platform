// client/src/pages/vehicles/VehicleForm.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const initialForm = {
  registration_number: "",
  vehicle_name: "",
  type: "",
  max_load_capacity: "",
  odometer: "",
  acquisition_cost: "",
  region: "",
  status: "Available",
};

export default function VehicleForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const res = await axios.get(`${API_BASE}/vehicles/${id}`);

      setForm({
        registration_number: res.data.registration_number || "",
        vehicle_name: res.data.vehicle_name || "",
        type: res.data.type || "",
        max_load_capacity: res.data.max_load_capacity || "",
        odometer: res.data.odometer || "",
        acquisition_cost: res.data.acquisition_cost || "",
        region: res.data.region || "",
        status: res.data.status || "Available",
      });
    } catch (err) {
      setError("Failed to load vehicle.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.registration_number.trim())
      newErrors.registration_number = "Registration number is required.";

    if (!form.vehicle_name.trim())
      newErrors.vehicle_name = "Vehicle name is required.";

    if (!form.type)
      newErrors.type = "Vehicle type is required.";

    if (!form.region)
      newErrors.region = "Region is required.";

    if (!form.status)
      newErrors.status = "Status is required.";

    if (
      form.max_load_capacity === "" ||
      Number(form.max_load_capacity) < 0
    ) {
      newErrors.max_load_capacity =
        "Load capacity must be 0 or greater.";
    }

    if (
      form.odometer === "" ||
      Number(form.odometer) < 0
    ) {
      newErrors.odometer =
        "Odometer must be 0 or greater.";
    }

    if (
      form.acquisition_cost === "" ||
      Number(form.acquisition_cost) < 0
    ) {
      newErrors.acquisition_cost =
        "Acquisition cost must be 0 or greater.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validate()) return;

    try {
      setSaving(true);

      if (isEdit) {
        await axios.put(`${API_BASE}/vehicles/${id}`, form);
        setSuccess("Vehicle updated successfully.");
      } else {
        await axios.post(`${API_BASE}/vehicles`, form);
        setSuccess("Vehicle created successfully.");
        setForm(initialForm);
      }

      setTimeout(() => {
        navigate("/vehicles");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save vehicle."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading vehicle...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold mb-6">
          {isEdit ? "Edit Vehicle" : "Create Vehicle"}
        </h1>

        {success && (
          <div className="mb-5 bg-green-100 text-green-700 p-3 rounded">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-5 bg-red-100 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-2 gap-5"
        >

          {/* Registration Number */}
          <div>
            <label className="block mb-1 font-medium">
              Registration Number
            </label>

            <input
              type="text"
              name="registration_number"
              value={form.registration_number}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />

            {errors.registration_number && (
              <p className="text-red-500 text-sm mt-1">
                {errors.registration_number}
              </p>
            )}
          </div>

          {/* Vehicle Name */}
          <div>
            <label className="block mb-1 font-medium">
              Vehicle Name
            </label>

            <input
              type="text"
              name="vehicle_name"
              value={form.vehicle_name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />

            {errors.vehicle_name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.vehicle_name}
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block mb-1 font-medium">
              Type
            </label>

            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select Type</option>
              <option>Bus</option>
              <option>Truck</option>
              <option>Van</option>
              <option>Car</option>
            </select>

            {errors.type && (
              <p className="text-red-500 text-sm mt-1">
                {errors.type}
              </p>
            )}
          </div>

          {/* Max Load */}
          <div>
            <label className="block mb-1 font-medium">
              Max Load Capacity (kg)
            </label>

            <input
              type="number"
              min="0"
              name="max_load_capacity"
              value={form.max_load_capacity}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />

            {errors.max_load_capacity && (
              <p className="text-red-500 text-sm mt-1">
                {errors.max_load_capacity}
              </p>
            )}
          </div>

          {/* Odometer */}
          <div>
            <label className="block mb-1 font-medium">
              Odometer (km)
            </label>

            <input
              type="number"
              min="0"
              name="odometer"
              value={form.odometer}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />

            {errors.odometer && (
              <p className="text-red-500 text-sm mt-1">
                {errors.odometer}
              </p>
            )}
          </div>

          {/* Acquisition Cost */}
          <div>
            <label className="block mb-1 font-medium">
              Acquisition Cost
            </label>

            <input
              type="number"
              min="0"
              name="acquisition_cost"
              value={form.acquisition_cost}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />

            {errors.acquisition_cost && (
              <p className="text-red-500 text-sm mt-1">
                {errors.acquisition_cost}
              </p>
            )}
          </div>

          {/* Region */}
          <div>
            <label className="block mb-1 font-medium">
              Region
            </label>

            <select
              name="region"
              value={form.region}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select Region</option>
              <option>North</option>
              <option>South</option>
              <option>East</option>
              <option>West</option>
            </select>

            {errors.region && (
              <p className="text-red-500 text-sm mt-1">
                {errors.region}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block mb-1 font-medium">
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option>Available</option>
              <option>Active</option>
              <option>Maintenance</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2 flex gap-4 mt-4">

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:bg-gray-400"
            >
              {saving
                ? "Saving..."
                : isEdit
                ? "Update Vehicle"
                : "Create Vehicle"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/vehicles")}
              className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-lg"
            >
              Cancel
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}