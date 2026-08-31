// The recharts drawing layer, split out so it can be lazy-loaded.
//
// recharts + its d3 dependencies are ~105 kB gzipped — nearly half the app's JS —
// and nothing on the critical path (login, onboarding, logging a workout, the
// History list, Settings) draws a chart. Keeping these three components in their
// own module lets `React.lazy` pull the recharts chunk only once a chart actually
// renders, so the core logging flow never pays for it.
//
// Everything here is presentational: the callers in gym-tracker-app.tsx compute
// the data, the palette and the tooltip formatters, and pass primitives in. This
// module imports nothing from the app file, so there is no load-time cycle with
// the lazy() call that pulls it.
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis,
} from 'recharts';

const FONT = 'Barlow, system-ui, sans-serif';
const tooltipStyle = (surface: string, line: string) => ({
  backgroundColor: surface,
  border: `1px solid ${line}`,
  borderRadius: '6px',
  fontFamily: FONT,
  fontSize: '12px',
});

// The muscle-split donut ring. `fills` is the resolved slice colour per slice, in
// slice order, so it can never drift from the legend the caller renders.
function DonutPie({ slices, fills, surface, line, muted, formatter }: any) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={slices} dataKey="value" nameKey="group"
          innerRadius="62%" outerRadius="88%" paddingAngle={1.5}
          startAngle={90} endAngle={-270}
          stroke={surface} strokeWidth={2} isAnimationActive={false}
        >
          {slices.map((d: any, i: number) => <Cell key={d.group} fill={fills[i]} />)}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle(surface, line)}
          labelStyle={{ color: muted }}
          formatter={formatter}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Body-weight trend — a line or bars per the user's choice. `data` arrives already
// in display units; this only draws.
function BodyWeightChart({ data, chartType, accent, grid, axis, surface, line, muted, units, height, compact }: any) {
  const font = { fontSize: compact ? '10px' : '11px', fontFamily: FONT };
  const margin = { top: 4, right: compact ? 4 : 8, left: compact ? -20 : -12, bottom: 0 };
  const chrome = (
    <>
      <CartesianGrid strokeDasharray="2 4" stroke={grid} vertical={false} />
      <XAxis dataKey="date" stroke={axis} tickLine={false} style={font} />
      <YAxis stroke={axis} tickLine={false} width={compact ? 38 : 44} domain={['dataMin - 1', 'dataMax + 1']} style={font} unit={compact ? undefined : ` ${units}`} />
      <Tooltip
        contentStyle={tooltipStyle(surface, line)}
        labelStyle={{ color: muted }}
        cursor={{ stroke: grid }}
        formatter={(v: any) => [`${v} ${units}`, 'Body weight']}
      />
    </>
  );
  return (
    <ResponsiveContainer width="100%" height={height}>
      {chartType === 'bar' ? (
        <BarChart data={data} margin={margin}>
          {chrome}
          <Bar dataKey="bodyWeight" fill={accent} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      ) : (
        <LineChart data={data} margin={margin}>
          {chrome}
          <Line type="monotone" dataKey="bodyWeight" stroke={accent} strokeWidth={2} dot={{ fill: accent, r: compact ? 2.5 : 3, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}

// One exercise's top-set-over-time line.
function TopSetChart({ data, accent, grid, axisStroke, surface, line, muted, units }: any) {
  const axis = { stroke: axisStroke, style: { fontSize: '11px', fontFamily: FONT } };
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke={grid} vertical={false} />
        <XAxis dataKey="date" {...axis} tickLine={false} />
        <YAxis {...axis} tickLine={false} width={44} unit={` ${units}`} />
        <Tooltip
          contentStyle={tooltipStyle(surface, line)}
          labelStyle={{ color: muted }}
          cursor={{ stroke: grid }}
          formatter={(value: any, _name: string, props: any) =>
            [`${value} ${units} × ${props.payload.repsAtMaxWeight} reps`, 'Top set']
          }
        />
        <Line type="monotone" dataKey="maxWeight" stroke={accent} strokeWidth={2} dot={{ fill: accent, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Single default export so React.lazy has one component to resolve; `kind`
// dispatches to the right chart.
export default function Chart({ kind, ...props }: any) {
  if (kind === 'donut') return <DonutPie {...props} />;
  if (kind === 'bodyweight') return <BodyWeightChart {...props} />;
  if (kind === 'topset') return <TopSetChart {...props} />;
  return null;
}
