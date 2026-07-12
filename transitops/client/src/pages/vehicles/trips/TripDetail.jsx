// client/src/pages/trips/TripDetail.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/trips";

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [completionData, setCompletionData] = useState({
    actual_distance: "",
    revenue: "",
    end_odometer: "",
    fuel_consumed: "",
  });

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/${id}`);
      setTrip(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load trip.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (action, payload = {}) => {
    try {
      setProcessing(true);

      await axios.patch(`${API_BASE}/${id}/${action}`, payload);

      await fetchTrip();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Unable to update trip status."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    const {
      actual_distance,
      revenue,
      end_odometer,
      fuel_consumed,
    } = completionData;

    if (
      !actual_distance ||
      !revenue ||
      !end_odometer ||
      !fuel_consumed
    ) {
      return alert("Please fill all completion fields.");
    }

    if (
      Number(actual_distance) <= 0 ||
      Number(revenue) < 0 ||
      Number(end_odometer) <= 0 ||
      Number(fuel_consumed) < 0
    ) {
      return alert("Please enter valid numeric values.");
    }

    updateStatus("complete", {
      actual_distance: Number(actual_distance),
      revenue: Number(revenue),
      end_odometer: Number(end_odometer),
      fuel_consumed: Number(fuel_consumed),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        Loading trip...
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-10 text-center text-red-600">
        Trip not found.
      </div>
    );
  }

  const status = trip.status?.toLowerCase();

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Trip Details
          </h1>

          <p className="text-gray-500">
            {trip.source} → {trip.destination}
          </p>
        </div>

        <button
          onClick={() => navigate("/trips")}
          className="rounded-lg border px-4 py-2 hover:bg-gray-100"
        >
          Back
        </button>
      </div>

      {/* Trip Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white shadow p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Trip Information
          </h2>

          <div className="space-y-3 text-sm">
            <Row
              label="Source"
              value={trip.source}
            />
            <Row
              label="Destination"
              value={trip.destination}
            />
            <Row
              label="Status"
              value={trip.status}
            />
            <Row
              label="Cargo Weight"
              value={`${trip.cargo_weight ?? "-"} kg`}
            />
            <Row
              label="Planned Distance"
              value={`${trip.planned_distance ?? "-"} km`}
            />
            <Row
              label="Revenue"
              value={`₹${trip.revenue ?? 0}`}
            />
          </div>
        </div>

        {/* Vehicle & Driver */}
        <div className="rounded-xl bg-white shadow p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Assignment
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-blue-700 mb-2">
                Vehicle
              </h3>

              <div className="space-y-2 text-sm">
                <Row
                  label="Vehicle"
                  value={
                    trip.vehicle?.vehicleNumber ||
                    trip.vehicle?.registrationNumber
                  }
                />

                <Row
                  label="Model"
                  value={trip.vehicle?.model}
                />

                <Row
                  label="Capacity"
                  value={`${trip.vehicle?.maxLoadCapacity ?? "-"} kg`}
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-green-700 mb-2">
                Driver
              </h3>

              <div className="space-y-2 text-sm">
                <Row
                  label="Name"
                  value={trip.driver?.name}
                />
                <Row
                  label="Phone"
                  value={trip.driver?.phone}
                />
                <Row
                  label="License"
                  value={trip.driver?.licenseNumber}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle */}
      <div className="rounded-xl bg-white shadow p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Lifecycle
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Row
            label="Created"
            value={formatDate(trip.createdAt)}
          />

          <Row
            label="Dispatched"
            value={formatDate(
              trip.dispatchedAt || trip.dispatchTime
            )}
          />

          <Row
            label="Completed"
            value={formatDate(
              trip.completedAt || trip.completionTime
            )}
          />

          <Row
            label="Cancelled"
            value={formatDate(
              trip.cancelledAt || trip.cancelTime
            )}
          />
        </div>
      </div>

      {/* Completion Form */}
      {status === "dispatched" && (
        <div className="rounded-xl bg-white shadow p-6">
          <h2 className="mb-5 text-xl font-semibold">
            Complete Trip
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Actual Distance (km)"
              value={completionData.actual_distance}
              onChange={(v) =>
                setCompletionData({
                  ...completionData,
                  actual_distance: v,
                })
              }
            />

            <Input
              label="Revenue"
              value={completionData.revenue}
              onChange={(v) =>
                setCompletionData({
                  ...completionData,
                  revenue: v,
                })
              }
            />

            <Input
              label="End Odometer"
              value={completionData.end_odometer}
              onChange={(v) =>
                setCompletionData({
                  ...completionData,
                  end_odometer: v,
                })
              }
            />

            <Input
              label="Fuel Consumed"
              value={completionData.fuel_consumed}
              onChange={(v) =>
                setCompletionData({
                  ...completionData,
                  fuel_consumed: v,
                })
              }
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="rounded-xl bg-white shadow p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Actions
        </h2>

        <div className="flex flex-wrap gap-4">
          {status === "draft" && (
            <>
              <button
                disabled={processing}
                onClick={() => updateStatus("dispatch")}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Dispatch
              </button>

              <button
                disabled={processing}
                onClick={() => updateStatus("cancel")}
                className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
              >
                Cancel
              </button>
            </>
          )}

          {status === "dispatched" && (
            <>
              <button
                disabled={processing}
                onClick={handleComplete}
                className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700"
              >
                Complete
              </button>

              <button
                disabled={processing}
                onClick={() => updateStatus("cancel")}
                className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between border-b pb-2">
    <span className="font-medium text-gray-600">{label}</span>
    <span className="text-gray-800">{value || "-"}</span>
  </div>
);

const Input = ({ label, value, onChange }) => (
  <div>
    <label className="mb-2 block font-medium">
      {label}
    </label>

    <input
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
    />
  </div>
);

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString();
};

export default TripDetail;