/* Sibling halves are imported with the explicit `.native` specifier: Metro resolves it, and
   it keeps the native tsconfig project from pulling a web `.tsx` in through a bare path. */
import { BarChart } from './BarChart.native';
import { ChartFrame } from './ChartFrame.native';
import { ChartLegend } from './ChartLegend.native';
import { inr } from './chart-money';
import { DonutChart } from './DonutChart.native';
import { FunnelChart } from './FunnelChart.native';
import { LineChart } from './LineChart.native';

/** All chart components as one namespace object. */
export const Charts = {
  ChartFrame,
  ChartLegend,
  BarChart,
  LineChart,
  DonutChart,
  FunnelChart,
  inr,
};
