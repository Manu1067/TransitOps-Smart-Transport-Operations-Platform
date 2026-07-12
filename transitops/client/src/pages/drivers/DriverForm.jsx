// client/src/pages/drivers/DriverForm.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const initialState = {
  name: "",
  license_number: "",
  license_category: "",
  license_expiry_date: "",
  contact_number: "",
  safety_score: "",
  status: "Active",
  region: "",
};

export default function DriverForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isEdit) {
      fetchDriver();
    }
  }, [id]);

  const fetchDriver = async () => {
    try {
      const res = await axios.get(`${API_BASE}/drivers/${id}`);

      setForm({
        name: res.data.name || "",
        license_number: res.data.license_number || "",
        license_category: res.data.license_category || "",
        license_expiry_date: res.data.license_expiry_date
          ? res.data.license_expiry_date.slice(0, 10)
          : "",
        contact_number: res.data.contact_number || "",
        safety_score: res.data.safety_score ?? "",
        status: res.data.status || "Active",
        region: res.data.region || "",
      });
    } catch (err) {
      setApiError("Unable to load driver.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim())
      newErrors.name = "Driver name is required.";

    if (!form.license_number.trim())
      newErrors.license_number = "License number is required.";

    if (!form.license_category)
      newErrors.license_category = "License category is required.";

    if (!form.license_expiry_date)
      newErrors.license_expiry_date = "Expiry date is required.";

    if (!form.contact_number.trim()) {
      newErrors.contact_number = "Contact number is required.";
    } else if (!/^[0-9+\-\s]{10,15}$/.test(form.contact_number)) {
      newErrors.contact_number = "Enter a valid contact number.";
    }

    if (form.safety_score === "") {
      newErrors.safety_score = "Safety score is required.";
    } else if (
      Number(form.safety_score) < 0 ||
      Number(form.safety_score) > 100
    ) {
      newErrors.safety_score =
        "Safety score must be between 0 and 100.";
    }

    if (!form.region)
      newErrors.region = "Region is required.";

    if (!form.status)
      newErrors.status = "Status is required.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setApiError("");
    setSuccess("");

    if (!validate()) return;

    try {
      setSaving(true);

      if (isEdit) {
        await axios.put(`${API_BASE}/drivers/${id}`, form);
        setSuccess("Driver updated successfully.");
      } else {
        await axios.post(`${API_BASE}/drivers`, form);
        setSuccess("Driver created successfully.");
        setForm(initialState);
      }

      setTimeout(() => {
        navigate("/drivers");
      }, 1200);
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
          "Failed to save driver."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        Loading Driver...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold mb-6">
          {isEdit ? "Edit Driver" : "Create Driver"}
        </h1>

        {apiError && (
          <div className="mb-5 rounded-lg bg-red-100 text-red-700 p-3">
            {apiError}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg bg-green-100 text-green-700 p-3">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >

          {/* Name */}
          <FormInput
            label="Driver Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />

          {/* License Number */}
          <FormInput
            label="License Number"
            name="license_number"
            value={form.license_number}
            onChange={handleChange}
            error={errors.license_number}
          />

          {/* License Category */}
          <div>
            <label className="block font-medium mb-1">
              License Category
            </label>

            <select
              name="license_category"
              value={form.license_category}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select Category</option>
              <option>LMV</option>
              <option>HMV</option>
              <option>MCWG</option>
              <option>Transport</option>
            </select>

            {errors.license_category && (
              <p className="text-red-500 text-sm mt-1">
                {errors.license_category}
              </p>
            )}
          </div>

          {/* Expiry */}
          <FormInput
            label="License Expiry"
            type="date"
            name="license_expiry_date"
            value={form.license_expiry_date}
            onChange={handleChange}
            error={errors.license_expiry_date}
          />

          {/* Contact */}
          <FormInput
            label="Contact Number"
            name="contact_number"
            value={form.contact_number}
            onChange={handleChange}
            error={errors.contact_number}
          />

          {/* Safety Score */}
          <FormInput
            label="Safety Score"
            type="number"
            name="safety_score"
            value={form.safety_score}
            onChange={handleChange}
            error={errors.safety_score}
            min="0"
            max="100"
          />

          {/* Region */}
          <div>
            <label className="block font-medium mb-1">
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
            <label className="block font-medium mb-1">
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option>Active</option>
              <option>On Duty</option>
              <option>Off Duty</option>
              <option>Suspended</option>
              <option>Inactive</option>
            </select>

            {errors.status && (
              <p className="text-red-500 text-sm mt-1">
                {errors.status}
              </p>
            )}
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
                ? "Update Driver"
                : "Create Driver"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/drivers")}
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

function FormInput({
  label,
  error,
  type = "text",
  ...props
}) {
  return (
    <div>
      <label className="block font-medium mb-1">
        {label}
      </label>

      <input
        type={type}
        {...props}
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      {error && (
        <p className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}