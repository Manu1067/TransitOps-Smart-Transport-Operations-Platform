// client/src/pages/trips/TripForm.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const VEHICLE_API = "http://localhost:5000/api/vehicles/assignable";
const DRIVER_API = "http://localhost:5000/api/drivers/assignable";
const TRIP_API = "http://localhost:5000/api/trips";

const TripForm = () => {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [backendErrors, setBackendErrors] = useState([]);
  const [clientError, setClientError] = useState("");

  const [formData, setFormData] = useState({
    source: "",
    destination: "",
    vehicle_id: "",
    driver_id: "",
    cargo_weight: "",
    planned_distance: "",
    revenue: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);

      const [vehicleRes, driverRes] = await Promise.all([
        axios.get(VEHICLE_API),
        axios.get(DRIVER_API),
      ]);

      setVehicles(vehicleRes.data || []);
      setDrivers(driverRes.data || []);
    } catch (err) {
      console.error(err);
      setBackendErrors([
        "Unable to load vehicles and drivers. Please refresh the page.",
      ]);
    } finally {
      setFetching(false);
    }
  };

  const selectedVehicle = useMemo(
    () =>
      vehicles.find(
        (vehicle) => vehicle._id === formData.vehicle_id
      ),
    [vehicles, formData.vehicle_id]
  );

  const handleChange = (e) => {
    setBackendErrors([]);
    setClientError("");

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    const cargo = Number(formData.cargo_weight);
    const distance = Number(formData.planned_distance);
    const revenue = Number(formData.revenue);

    if (cargo <= 0) {
      setClientError("Cargo weight must be greater than 0.");
      return false;
    }

    if (distance <= 0) {
      setClientError("Planned distance must be greater than 0.");
      return false;
    }

    if (revenue < 0) {
      setClientError("Revenue cannot be negative.");
      return false;
    }

    if (
      selectedVehicle?.maxLoadCapacity &&
      cargo > selectedVehicle.maxLoadCapacity
    ) {
      setClientError(
        `Cargo exceeds vehicle capacity (${selectedVehicle.maxLoadCapacity} kg).`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      setBackendErrors([]);

      await axios.post(TRIP_API, {
        source: formData.source,
        destination: formData.destination,
        vehicle_id: formData.vehicle_id,
        driver_id: formData.driver_id,
        cargo_weight: Number(formData.cargo_weight),
        planned_distance: Number(formData.planned_distance),
        revenue: Number(formData.revenue),
      });

      navigate("/trips");
    } catch (err) {
      console.error(err);

      if (err.response?.data?.errors) {
        setBackendErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setBackendErrors([err.response.data.message]);
      } else {
        setBackendErrors([
          "Failed to create trip. Please try again.",
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          Create Trip
        </h1>

        {clientError && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
            {clientError}
          </div>
        )}

        {backendErrors.length > 0 && (
          <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="mb-2 font-semibold text-red-700">
              Please fix the following:
            </p>

            <ul className="list-disc pl-5 text-red-600">
              {backendErrors.map((error, index) => (
                <li key={index}>
                  {typeof error === "string"
                    ? error
                    : error.msg || error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">
                Source
              </label>

              <input
                type="text"
                name="source"
                required
                value={formData.source}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Destination
              </label>

              <input
                type="text"
                name="destination"
                required
                value={formData.destination}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Vehicle
              </label>

              <select
                name="vehicle_id"
                required
                value={formData.vehicle_id}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Vehicle</option>

                {vehicles.map((vehicle) => (
                  <option
                    key={vehicle._id}
                    value={vehicle._id}
                  >
                    {vehicle.vehicleNumber ||
                      vehicle.registrationNumber}
                  </option>
                ))}
              </select>

              {selectedVehicle && (
                <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                  <p>
                    <strong>Max Load Capacity:</strong>{" "}
                    {selectedVehicle.maxLoadCapacity} kg
                  </p>

                  {selectedVehicle.model && (
                    <p>
                      <strong>Model:</strong>{" "}
                      {selectedVehicle.model}
                    </p>
                  )
                  }

                  {selectedVehicle.type && (
                    <p>
                      <strong>Type:</strong>{" "}
                      {selectedVehicle.type}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Driver
              </label>

              <select
                name="driver_id"
                required
                value={formData.driver_id}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Driver</option>

                {drivers.map((driver) => (
                  <option
                    key={driver._id}
                    value={driver._id}
                  >
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Cargo Weight (kg)
              </label>

              <input
                type="number"
                min="1"
                step="0.01"
                required
                name="cargo_weight"
                value={formData.cargo_weight}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Planned Distance (km)
              </label>

              <input
                type="number"
                min="1"
                step="0.01"
                required
                name="planned_distance"
                value={formData.planned_distance}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block font-medium">
                Revenue (₹)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                required
                name="revenue"
                value={formData.revenue}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/trips")}
              className="rounded-lg border border-gray-300 px-5 py-2 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripForm;