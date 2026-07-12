// client/src/pages/reports/Reports.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart3,
  Truck,
  Fuel,
  IndianRupee,
  TrendingUp,
  Download,
} from "lucide-react";

const REPORT_API = "http://localhost:5000/api/reports";

const Reports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${REPORT_API}/fleet`);

      setReport(res.data);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Unable to load report."
      );
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      setExporting(true);

      const res = await axios.get(
        `${REPORT_API}/fleet/export`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type: "text/csv",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `fleet-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export report.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-72 text-gray-500">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Fleet Reports
            </h1>

            <p className="text-gray-500">
              Fleet analytics, operational insights and financial
              performance.
            </p>
          </div>
        </div>

        <button
          onClick={exportCSV}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-white font-medium hover:bg-green-700 disabled:opacity-60"
        >
          <Download size={18} />
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Fleet Utilization"
          value={`${report?.fleetUtilization?.overallUtilization ?? 0}%`}
          icon={<Truck size={22} />}
          color="blue"
        />

        <SummaryCard
          title="Operational Cost"
          value={`₹${Number(
            report?.vehicleOperationalCost?.totalCost || 0
          ).toLocaleString()}`}
          icon={<IndianRupee size={22} />}
          color="red"
        />

        <SummaryCard
          title="Fuel Efficiency"
          value={`${
            report?.fuelEfficiency?.averageEfficiency ?? 0
          } km/L`}
          icon={<Fuel size={22} />}
          color="amber"
        />

        <SummaryCard
          title="ROI"
          value={`${report?.roi?.overallROI ?? 0}%`}
          icon={<TrendingUp size={22} />}
          color="green"
        />
      </div>

      {/* Fleet Utilization */}
      <Section title="Fleet Utilization">
        <ResponsiveTable
          headers={[
            "Vehicle",
            "Trips",
            "Distance",
            "Utilization %",
          ]}
          rows={report?.fleetUtilization?.vehicles || []}
          renderRow={(item) => (
            <>
              <td className="px-4 py-3">
                {item.vehicle}
              </td>

              <td className="px-4 py-3">
                {item.trips}
              </td>

              <td className="px-4 py-3">
                {item.distance} km
              </td>

              <td className="px-4 py-3 font-semibold text-blue-600">
                {item.utilization}%
              </td>
            </>
          )}
        />
      </Section>

      {/* Vehicle Cost */}
      <Section title="Vehicle Operational Cost">
        <ResponsiveTable
          headers={[
            "Vehicle",
            "Fuel Cost",
            "Maintenance",
            "Other",
            "Total",
          ]}
          rows={
            report?.vehicleOperationalCost?.vehicles || []
          }
          renderRow={(item) => (
            <>
              <td className="px-4 py-3">
                {item.vehicle}
              </td>

              <td className="px-4 py-3">
                ₹{item.fuelCost}
              </td>

              <td className="px-4 py-3">
                ₹{item.maintenanceCost}
              </td>

              <td className="px-4 py-3">
                ₹{item.otherCost}
              </td>

              <td className="px-4 py-3 font-semibold">
                ₹{item.totalCost}
              </td>
            </>
          )}
        />
      </Section>

      {/* Fuel Efficiency */}
      <Section title="Fuel Efficiency">
        <ResponsiveTable
          headers={[
            "Vehicle",
            "Distance",
            "Fuel Used",
            "Efficiency",
          ]}
          rows={report?.fuelEfficiency?.vehicles || []}
          renderRow={(item) => (
            <>
              <td className="px-4 py-3">
                {item.vehicle}
              </td>

              <td className="px-4 py-3">
                {item.distance} km
              </td>

              <td className="px-4 py-3">
                {item.fuelUsed} L
              </td>

              <td className="px-4 py-3 font-semibold text-green-600">
                {item.efficiency} km/L
              </td>
            </>
          )}
        />
      </Section>

      {/* ROI */}
      <Section title="Return on Investment (ROI)">
        <ResponsiveTable
          headers={[
            "Vehicle",
            "Revenue",
            "Cost",
            "Profit",
            "ROI",
          ]}
          rows={report?.roi?.vehicles || []}
          renderRow={(item) => (
            <>
              <td className="px-4 py-3">
                {item.vehicle}
              </td>

              <td className="px-4 py-3">
                ₹{item.revenue}
              </td>

              <td className="px-4 py-3">
                ₹{item.cost}
              </td>

              <td className="px-4 py-3">
                ₹{item.profit}
              </td>

              <td className="px-4 py-3 font-semibold text-emerald-600">
                {item.roi}%
              </td>
            </>
          )}
        />
      </Section>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="rounded-xl bg-white shadow">
    <div className="border-b px-6 py-4">
      <h2 className="text-xl font-semibold text-gray-800">
        {title}
      </h2>
    </div>

    <div className="p-4 overflow-x-auto">
      {children}
    </div>
  </div>
);

const ResponsiveTable = ({
  headers,
  rows,
  renderRow,
}) => (
  <table className="min-w-full">
    <thead className="bg-gray-100">
      <tr>
        {headers.map((header) => (
          <th
            key={header}
            className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td
            colSpan={headers.length}
            className="py-8 text-center text-gray-500"
          >
            No data available.
          </td>
        </tr>
      ) : (
        rows.map((item, index) => (
          <tr
            key={index}
            className="border-t hover:bg-gray-50"
          >
            {renderRow(item)}
          </tr>
        ))
      )}
    </tbody>
  </table>
);

const SummaryCard = ({
  title,
  value,
  icon,
  color,
}) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold text-gray-800">
            {value}
          </h3>
        </div>

        <div
          className={`rounded-full p-3 ${
            colors[color] || colors.blue
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Reports;