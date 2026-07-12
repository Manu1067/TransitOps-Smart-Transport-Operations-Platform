// client/src/pages/fuel-expenses/ExpenseForm.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Receipt, Save, ArrowLeft } from "lucide-react";

const VEHICLE_API = "http://localhost:5000/api/vehicles";
const TRIP_API = "http://localhost:5000/api/trips";
const EXPENSE_API = "http://localhost:5000/api/expenses";

const expenseTypes = [
  "Toll",
  "Maintenance",
  "Other",
];

const ExpenseForm = () => {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState([]);

  const [formData, setFormData] = useState({
    vehicle_id: "",
    trip_id: "",
    expense_type: "Toll",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const [vehicleRes, tripRes] = await Promise.all([
        axios.get(VEHICLE_API),
        axios.get(TRIP_API),
      ]);

      setVehicles(vehicleRes.data || []);
      setTrips(tripRes.data || []);
    } catch (err) {
      console.error(err);

      setErrors([
        "Unable to load vehicles or trips. Please refresh the page.",
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

    if (!formData.expense_type)
      validationErrors.push("Expense type is required.");

    if (!formData.description.trim())
      validationErrors.push("Description is required.");

    if (!formData.date)
      validationErrors.push("Date is required.");

    if (formData.amount === "")
      validationErrors.push("Amount is required.");
    else if (Number(formData.amount) < 0)
      validationErrors.push("Amount cannot be negative.");

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSaving(true);
      setErrors([]);

      const payload = {
        vehicle_id: formData.vehicle_id,
        trip_id: formData.trip_id || null,
        expense_type: formData.expense_type,
        description: formData.description,
        amount: Number(formData.amount),
        date: formData.date,
      };

      await axios.post(EXPENSE_API, payload);

      navigate("/fuel-expenses");
    } catch (err) {
      console.error(err);

      if (err.response?.data?.errors) {
        setErrors(
          err.response.data.errors.map(
            (error) => error.msg || error.message
          )
        );
      } else {
        setErrors([
          err.response?.data?.message ||
            "Failed to create expense.",
        ]);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10 text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-xl bg-white shadow-lg">
        {/* Header */}
        <div className="border-b px-8 py-6">
          <div className="flex items-center gap-3">
            <Receipt className="h-7 w-7 text-blue-600" />

            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Create Expense
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Record transport-related operational expenses.
              </p>
            </div>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mx-8 mt-6 rounded-lg border border-red-300 bg-red-50 p-4">
            <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
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
              Vehicle *
            </label>

            <select
              name="vehicle_id"
              value={formData.vehicle_id}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              <option value="">Select Vehicle</option>

              {vehicles.map((vehicle) => (
                <option
                  key={vehicle._id}
                  value={vehicle._id}
                >
                  {vehicle.vehicleNumber ||
                    vehicle.registrationNumber}
                  {vehicle.model ? ` • ${vehicle.model}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Trip */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Trip (Optional)
            </label>

            <select
              name="trip_id"
              value={formData.trip_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              <option value="">No Trip</option>

              {trips.map((trip) => (
                <option
                  key={trip._id}
                  value={trip._id}
                >
                  {trip.source} → {trip.destination}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Expense Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Expense Type *
              </label>

              <select
                name="expense_type"
                value={formData.expense_type}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                {expenseTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Amount (₹) *
              </label>

              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description *
            </label>

            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the expense..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Date *
            </label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;