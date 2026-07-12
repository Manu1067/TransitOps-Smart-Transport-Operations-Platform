import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import KpiCard from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Table from '../../components/ui/Table';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { ROLES } from '../../utils/constants';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercentage,
} from '../../utils/formatters';

const MANAGEMENT_ROLES = [ROLES.ADMIN, ROLES.DISPATCHER];
const RECENT_TRIP_LIMIT = 10;

function DetailField({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value ?? '—'}</dd>
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function formatRoute(source, destination) {
  if (!source && !destination) {
    return '—';
  }

  return `${source ?? '—'} → ${destination ?? '—'}`;
}

const tripColumns = [
  {
    header: 'Route',
    render: (row) => formatRoute(row.source, row.destination),
  },
  {
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: 'Created',
    accessor: 'created_at',
    render: (row) => formatDateTime(row.created_at),
  },
  {
    header: '',
    render: (row) => (
      <Link
        to={`/trips/${row.id}`}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        View
      </Link>
    ),
  },
];

const fuelColumns = [
  {
    header: 'Date',
    accessor: 'filled_at',
    render: (row) => formatDate(row.filled_at),
  },
  {
    header: 'Liters',
    accessor: 'liters',
    render: (row) => formatNumber(row.liters),
  },
  {
    header: 'Cost',
    accessor: 'cost',
    render: (row) => formatCurrency(row.cost),
  },
  {
    header: 'Station',
    accessor: 'station_name',
  },
  {
    header: 'Odometer',
    accessor: 'odometer_reading',
    render: (row) => formatNumber(row.odometer_reading),
  },
];

const expenseColumns = [
  {
    header: 'Date',
    accessor: 'incurred_at',
    render: (row) => formatDate(row.incurred_at),
  },
  {
    header: 'Type',
    accessor: 'expense_type',
  },
  {
    header: 'Amount',
    accessor: 'amount',
    render: (row) => formatCurrency(row.amount),
  },
  {
    header: 'Description',
    accessor: 'description',
    cellClassName: 'whitespace-normal max-w-xs',
  },
];

export default function VehicleDetail() {
  const { id } = useParams();
  const { role } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedLoading, setRelatedLoading] = useState(true);

  const canEdit = MANAGEMENT_ROLES.includes(role);

  useEffect(() => {
    let isMounted = true;

    const fetchVehicle = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.get(`/vehicles/${id}`);

        if (!isMounted) {
          return;
        }

        setVehicle(data.data);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message =
          err.response?.data?.message ||
          err.message ||
          'Failed to load vehicle details.';
        setError(message);
        setVehicle(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVehicle();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!vehicle) {
      setRelatedLoading(false);
      return undefined;
    }

    let isMounted = true;

    const fetchRelatedData = async () => {
      setRelatedLoading(true);

      const params = { vehicle_id: id };

      const [fuelResult, expensesResult, tripsResult, reportResult] = await Promise.allSettled([
        api.get('/fuel', { params }),
        api.get('/expenses', { params }),
        api.get('/trips', { params }),
        api.get(`/reports/vehicles/${id}`),
      ]);

      if (!isMounted) {
        return;
      }

      if (fuelResult.status === 'fulfilled') {
        setFuelLogs(fuelResult.value.data?.data ?? []);
      } else {
        setFuelLogs([]);
      }

      if (expensesResult.status === 'fulfilled') {
        setExpenses(expensesResult.value.data?.data ?? []);
      } else {
        setExpenses([]);
      }

      if (tripsResult.status === 'fulfilled') {
        const tripData = tripsResult.value.data?.data ?? [];
        setTrips(tripData.slice(0, RECENT_TRIP_LIMIT));
      } else {
        setTrips([]);
      }

      if (reportResult.status === 'fulfilled') {
        setReport(reportResult.value.data?.data ?? null);
      } else {
        setReport(null);
      }

      setRelatedLoading(false);
    };

    fetchRelatedData();

    return () => {
      isMounted = false;
    };
  }, [id, vehicle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
          aria-hidden="true"
        />
        <span className="sr-only">Loading vehicle details</span>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-rose-900">Unable to load vehicle</h1>
        <p className="mt-2 text-sm text-rose-700">{error ?? 'Vehicle not found.'}</p>
        <Link
          to="/vehicles"
          className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Back to Vehicles
        </Link>
      </div>
    );
  }

  const operationalCost = report?.operationalCost;
  const fuelEfficiency = report?.fuelEfficiency;
  const utilization = report?.utilization;
  const roi = report?.roi;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              to="/vehicles"
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              ← Back to Vehicles
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {vehicle.registration_number}
              </h1>
              <StatusBadge status={vehicle.status} />
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {vehicle.make} {vehicle.model}
              {vehicle.year ? ` · ${vehicle.year}` : ''}
            </p>
          </div>

          {canEdit ? (
            <Link
              to={`/vehicles/${id}/edit`}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit Vehicle
            </Link>
          ) : null}
        </div>
      </div>

      {report ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Operational Cost"
            value={formatCurrency(operationalCost?.total)}
            subtitle={
              operationalCost
                ? `Fuel ${formatCurrency(operationalCost.fuelCost)} · Maint. ${formatCurrency(operationalCost.maintenanceCost)}`
                : null
            }
            icon="₹"
          />
          <KpiCard
            title="Fuel Efficiency"
            value={
              fuelEfficiency?.value != null
                ? `${formatNumber(fuelEfficiency.value)} ${fuelEfficiency.unit ?? 'km/L'}`
                : '—'
            }
            icon="⛽"
          />
          <KpiCard
            title="Utilization"
            value={
              utilization?.percentage != null
                ? formatPercentage(utilization.percentage)
                : '—'
            }
            subtitle={
              report.counts?.trips != null
                ? `${report.counts.completedTrips ?? 0} of ${report.counts.trips} trips completed`
                : null
            }
            icon="📊"
          />
          <KpiCard
            title="ROI"
            value={roi?.percentage != null ? `${formatNumber(roi.percentage)}%` : '—'}
            subtitle={roi?.netReturn != null ? `Net return ${formatCurrency(roi.netReturn)}` : null}
            icon="📈"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Specifications</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="Registration" value={vehicle.registration_number} />
            <DetailField label="Make" value={vehicle.make} />
            <DetailField label="Model" value={vehicle.model} />
            <DetailField label="Year" value={vehicle.year} />
            <DetailField
              label="Current Odometer"
              value={
                vehicle.current_odometer != null
                  ? `${formatNumber(vehicle.current_odometer)} km`
                  : null
              }
            />
            <DetailField
              label="Fuel Capacity"
              value={
                vehicle.fuel_capacity_liters != null
                  ? `${formatNumber(vehicle.fuel_capacity_liters)} L`
                  : null
              }
            />
            <DetailField label="VIN" value={vehicle.vin} />
            <DetailField
              label="Acquisition Cost"
              value={formatCurrency(vehicle.acquisition_cost)}
            />
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            {vehicle.notes?.trim() ? vehicle.notes : 'No notes recorded for this vehicle.'}
          </p>
        </section>
      </div>

      <SectionCard
        title="Recent Trips"
        description={`Last ${RECENT_TRIP_LIMIT} trips assigned to this vehicle.`}
      >
        <Table
          columns={tripColumns}
          data={trips}
          loading={relatedLoading}
          emptyMessage="No trips recorded for this vehicle."
        />
      </SectionCard>

      <SectionCard title="Fuel Logs" description="Fuel fill-ups and consumption records.">
        <Table
          columns={fuelColumns}
          data={fuelLogs}
          loading={relatedLoading}
          emptyMessage="No fuel logs recorded for this vehicle."
        />
      </SectionCard>

      <SectionCard title="Expenses" description="Tolls, maintenance, and other vehicle costs.">
        <Table
          columns={expenseColumns}
          data={expenses}
          loading={relatedLoading}
          emptyMessage="No expenses recorded for this vehicle."
        />
      </SectionCard>
    </div>
  );
}
