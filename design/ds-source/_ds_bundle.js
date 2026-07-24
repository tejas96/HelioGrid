/* @ds-bundle: {"format":4,"namespace":"HelioGridDesignSystem_c8aa43","components":[{"name":"Avatar","sourcePath":"components/data/Avatar.jsx"},{"name":"AvatarGroup","sourcePath":"components/data/Avatar.jsx"},{"name":"Card","sourcePath":"components/data/Card.jsx"},{"name":"IconCircle","sourcePath":"components/data/Card.jsx"},{"name":"Chip","sourcePath":"components/data/Chip.jsx"},{"name":"Badge","sourcePath":"components/data/Chip.jsx"},{"name":"ListRow","sourcePath":"components/data/ListRow.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"StatusChip","sourcePath":"components/data/StatusChip.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"OfflineBanner","sourcePath":"components/feedback/OfflineBanner.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"SegmentedControl","sourcePath":"components/navigation/SegmentedControl.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/data/Avatar.jsx":"700963fcbc81","components/data/Card.jsx":"e5aaf2957ef1","components/data/Chip.jsx":"2cfeec6aa453","components/data/ListRow.jsx":"e22d1a60d2de","components/data/StatCard.jsx":"f004f83b6325","components/data/StatusChip.jsx":"ab35706da257","components/feedback/EmptyState.jsx":"89591964566e","components/feedback/OfflineBanner.jsx":"c59657b385d8","components/feedback/ProgressBar.jsx":"7543c4335d80","components/feedback/Toast.jsx":"39a06af24476","components/forms/Button.jsx":"8ef1940ff1ee","components/forms/Checkbox.jsx":"d2886a553c61","components/forms/IconButton.jsx":"f420ce6295f2","components/forms/Input.jsx":"0aeb42c400e7","components/forms/Radio.jsx":"17cea995ff16","components/forms/Switch.jsx":"53c4d1a544a1","components/navigation/SegmentedControl.jsx":"35726a280fdd","components/navigation/Tabs.jsx":"3f0f1558b6fd","ui_kits/desktop/screens.jsx":"1a781003cd82","ui_kits/desktop/shell.jsx":"076ba268bda9","ui_kits/mobile/overlays.jsx":"07e0de2cf430","ui_kits/mobile/screens.jsx":"2d181e53d592","ui_kits/mobile/shell.jsx":"1ce9e7e47eb7"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HelioGridDesignSystem_c8aa43 = window.HelioGridDesignSystem_c8aa43 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  24: 11,
  32: 13,
  40: 15,
  56: 20,
  80: 28
};

/** Perfect-circle avatar. Fallback = initials on a soft brand tint. */
function Avatar({
  src,
  name = "",
  size = 40,
  style = {}
}) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
      overflow: "hidden",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--accent-subtle)",
      color: "var(--accent)",
      fontSize: SIZES[size] || Math.round(size * 0.38),
      fontWeight: 500,
      ...style
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials);
}

/** Overlapping avatar group with 2px white ring. */
function AvatarGroup({
  people = [],
  size = 32,
  max = 4
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center"
    }
  }, shown.map((p, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      marginLeft: i ? -size * 0.3 : 0,
      borderRadius: "50%",
      boxShadow: "0 0 0 2px var(--surface)"
    }
  }, /*#__PURE__*/React.createElement(Avatar, _extends({}, p, {
    size: size
  })))), extra > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: -size * 0.3,
      boxShadow: "0 0 0 2px var(--surface)",
      borderRadius: "50%",
      width: size,
      height: size,
      background: "var(--canvas-sunken)",
      color: "var(--text-secondary)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.36,
      fontWeight: 500
    }
  }, "+", extra));
}
Object.assign(__ds_scope, { Avatar, AvatarGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Floating white card. No border — e2 at rest, e3 + -1px translate on hover. */
function Card({
  children,
  density = "expressive",
  interactive = false,
  selected = false,
  style = {},
  onClick,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const isExpr = density === "expressive";
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: "var(--surface)",
      borderRadius: isExpr ? "var(--r-card-expressive)" : "var(--r-card-functional)",
      padding: isExpr ? 24 : 16,
      boxShadow: selected ? "var(--e2), 0 0 0 2px var(--accent)" : hover ? "var(--e3)" : "var(--e2)",
      transform: hover ? "translateY(-1px)" : "none",
      transition: "box-shadow var(--dur-standard) var(--ease-standard), transform var(--dur-standard) var(--ease-standard)",
      cursor: interactive ? "pointer" : "default",
      ...style
    }
  }, rest), children);
}

/** Signature circular icon container — a soft tint of a semantic/brand colour. */
function IconCircle({
  children,
  color = "var(--accent)",
  size = 40,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: `color-mix(in srgb, ${color} 6%, white)`,
      color,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card, IconCircle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Fully-pill chip. Filter variant: white+e1 at rest, near-black fill when active. */
function Chip({
  children,
  active = false,
  onClick,
  dot,
  tone = "neutral",
  density = "expressive",
  style = {},
  ...rest
}) {
  const isExpr = density === "expressive";
  const tones = {
    neutral: "var(--neutral)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    info: "var(--info)",
    accent: "var(--accent)"
  };
  const dotColor = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("button", _extends({
    onClick: onClick,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      border: "none",
      cursor: onClick ? "pointer" : "default",
      height: isExpr ? 28 : 24,
      padding: "0 12px",
      borderRadius: "var(--r-pill)",
      fontFamily: "var(--font-sans)",
      fontSize: isExpr ? 13 : 12,
      fontWeight: 500,
      whiteSpace: "nowrap",
      background: active ? "var(--action-primary)" : "var(--surface)",
      color: active ? "#fff" : "var(--text-primary)",
      boxShadow: active ? "none" : "var(--e1)",
      transition: "background var(--dur-standard) var(--ease-standard)",
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: active ? "#fff" : dotColor
    }
  }), children);
}

/** Tinted semantic badge — semantic bg + text. */
function Badge({
  children,
  tone = "neutral",
  density = "expressive",
  style = {}
}) {
  const map = {
    neutral: ["var(--neutral)", "var(--neutral-bg)"],
    success: ["var(--success)", "var(--success-bg)"],
    warning: ["var(--warning)", "var(--warning-bg)"],
    danger: ["var(--danger)", "var(--danger-bg)"],
    info: ["var(--info)", "var(--info-bg)"],
    accent: ["var(--accent)", "var(--accent-subtle)"]
  };
  const [c, bg] = map[tone] || map.neutral;
  const isExpr = density === "expressive";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      height: isExpr ? 28 : 24,
      padding: "0 12px",
      borderRadius: "var(--r-pill)",
      background: bg,
      color: c,
      fontSize: isExpr ? 13 : 12,
      fontWeight: 500,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Chip, Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Chip.jsx", error: String((e && e.message) || e) }); }

// components/data/ListRow.jsx
try { (() => {
/** List row — circular leading, two-line text, trailing action. Separates by luminance/gap, never a divider. */
function ListRow({
  icon,
  iconColor = "var(--accent)",
  avatar,
  title,
  subtitle,
  trailing,
  density = "expressive",
  onClick,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  const isExpr = density === "expressive";
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      minHeight: isExpr ? 64 : 44,
      padding: isExpr ? "10px 16px" : "6px 12px",
      background: hover ? "var(--surface)" : "transparent",
      borderRadius: isExpr ? "var(--r-md)" : "var(--rf-md)",
      boxShadow: hover ? "var(--e2)" : "none",
      cursor: onClick ? "pointer" : "default",
      transition: "box-shadow var(--dur-standard) var(--ease-standard), background var(--dur-standard) var(--ease-standard)",
      ...style
    }
  }, avatar || icon && /*#__PURE__*/React.createElement(__ds_scope.IconCircle, {
    color: iconColor,
    size: isExpr ? 40 : 32
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: isExpr ? 15 : 13,
      fontWeight: 700,
      letterSpacing: "-0.01em",
      color: "var(--text-primary)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-secondary)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, subtitle)), trailing);
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
/** KPI card: overline -> big tabular value -> delta chip. */
function StatCard({
  label,
  value,
  unit,
  delta,
  deltaDir = "up",
  style = {},
  children
}) {
  const good = deltaDir === "up";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      borderRadius: "var(--r-card-expressive)",
      padding: 24,
      boxShadow: "var(--e2)",
      position: "relative",
      overflow: "hidden",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "var(--text-tertiary)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 32,
      fontWeight: 700,
      letterSpacing: "-0.025em",
      color: "var(--text-primary)",
      fontVariantNumeric: "tabular-nums"
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: "var(--text-secondary)"
    }
  }, unit)), delta != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      marginTop: 12,
      height: 24,
      padding: "0 10px",
      borderRadius: "var(--r-pill)",
      fontSize: 12,
      fontWeight: 500,
      background: good ? "var(--success-bg)" : "var(--danger-bg)",
      color: good ? "var(--success)" : "var(--danger)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, good ? /*#__PURE__*/React.createElement("path", {
    d: "M7 17 17 7M17 7H9m8 0v8"
  }) : /*#__PURE__*/React.createElement("path", {
    d: "M7 7l10 10M17 17H9m8 0V9"
  })), delta), children);
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/data/StatusChip.jsx
try { (() => {
/** Solar-domain status maps to a semantic colour. Status never by colour alone — always the label + dot. */
const STATUS = {
  "lead": {
    c: "var(--neutral)",
    bg: "var(--neutral-bg)",
    label: "Lead"
  },
  "survey-scheduled": {
    c: "var(--info)",
    bg: "var(--info-bg)",
    label: "Survey scheduled"
  },
  "design-in-progress": {
    c: "var(--warning)",
    bg: "var(--warning-bg)",
    label: "Design in progress"
  },
  "approved": {
    c: "var(--accent)",
    bg: "var(--accent-subtle)",
    label: "Approved"
  },
  "installing": {
    c: "var(--info)",
    bg: "var(--info-bg)",
    label: "Installing"
  },
  "commissioned": {
    c: "var(--success)",
    bg: "var(--success-bg)",
    label: "Commissioned"
  },
  "on-hold": {
    c: "var(--danger)",
    bg: "var(--danger-bg)",
    label: "On hold"
  }
};
function StatusChip({
  status = "lead",
  label,
  density = "expressive",
  style = {}
}) {
  const s = STATUS[status] || STATUS.lead;
  const isExpr = density === "expressive";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: isExpr ? 28 : 24,
      padding: "0 12px",
      borderRadius: "var(--r-pill)",
      background: s.bg,
      color: s.c,
      fontSize: isExpr ? 13 : 12,
      fontWeight: 500,
      whiteSpace: "nowrap",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: s.c,
      flexShrink: 0
    }
  }), label || s.label);
}
Object.assign(__ds_scope, { StatusChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatusChip.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
/** Centred empty state with a soft brand-glow bloom behind a large circular icon container. */
function EmptyState({
  icon,
  title,
  description,
  action,
  glow = true,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: "48px 24px",
      gap: 8,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      marginBottom: 12,
      display: "grid",
      placeItems: "center"
    }
  }, glow && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      width: 180,
      height: 180,
      background: "var(--glow-brand)",
      borderRadius: "50%",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      width: 72,
      height: 72,
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--surface)",
      boxShadow: "var(--e2)",
      color: "var(--text-tertiary)"
    }
  }, icon)), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.015em",
      color: "var(--text-primary)"
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 320,
      fontSize: 13,
      lineHeight: 1.5,
      color: "var(--text-secondary)",
      textWrap: "pretty"
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/OfflineBanner.jsx
try { (() => {
/** Persistent slim pill banner — surveyors work without signal. Warning colours, never blocks interaction. */
function OfflineBanner({
  count = 0,
  message,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 32,
      padding: "0 14px",
      borderRadius: "var(--r-pill)",
      background: "var(--warning-bg)",
      color: "var(--warning)",
      fontSize: 13,
      fontWeight: 500,
      boxShadow: "var(--e1)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 14 0M2 8.8l2 2M22 8.8l-11 11"
  })), message || `Offline — ${count} change${count === 1 ? "" : "s"} queued`);
}
Object.assign(__ds_scope, { OfflineBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/OfflineBanner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
/** Linear progress. 6px pill track; fill accent, or brand gradient for AI/long-running ops. */
function ProgressBar({
  value = 0,
  gradient = false,
  style = {}
}) {
  const pct = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuenow": pct,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    style: {
      height: 6,
      width: "100%",
      borderRadius: "var(--r-pill)",
      background: "var(--canvas-sunken)",
      overflow: "hidden",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: pct + "%",
      borderRadius: "var(--r-pill)",
      background: gradient ? "var(--gradient-brand)" : "var(--accent)",
      transition: "width var(--dur-emphasised) var(--ease-standard)"
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const TONES = {
  success: ["var(--success)", "var(--success-bg)"],
  warning: ["var(--warning)", "var(--warning-bg)"],
  danger: ["var(--danger)", "var(--danger-bg)"],
  info: ["var(--info)", "var(--info-bg)"],
  neutral: ["var(--neutral)", "var(--neutral-bg)"]
};

/** White toast card with leading semantic icon in a circular tint. e5, sits above bottom nav. */
function Toast({
  tone = "success",
  title,
  description,
  icon,
  action,
  style = {}
}) {
  const [c, bg] = TONES[tone] || TONES.success;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      maxWidth: 420,
      padding: "12px 16px",
      background: "var(--surface)",
      borderRadius: 16,
      boxShadow: "var(--e5)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: bg,
      color: c
    }
  }, icon || /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "-0.01em",
      color: "var(--text-primary)"
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-secondary)"
    }
  }, description)), action);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  lg: {
    height: 48,
    padding: "0 24px",
    font: 15
  },
  md: {
    height: 40,
    padding: "0 20px",
    font: 15
  },
  sm: {
    height: 32,
    padding: "0 16px",
    font: 13
  }
};
const VARIANTS = {
  primary: {
    bg: "var(--action-primary)",
    color: "#fff",
    shadow: "none",
    hoverShadow: "var(--e2)"
  },
  secondary: {
    bg: "var(--surface)",
    color: "var(--text-primary)",
    shadow: "var(--e1)",
    hoverShadow: "var(--e2)"
  },
  ghost: {
    bg: "transparent",
    color: "var(--text-secondary)",
    shadow: "none",
    hoverShadow: "none"
  },
  destructive: {
    bg: "var(--danger)",
    color: "#fff",
    shadow: "none",
    hoverShadow: "var(--e2)"
  }
};

/**
 * Primary action is near-black — the strongest identity marker. Always pill-shaped.
 */
function Button({
  children,
  variant = "primary",
  size = "lg",
  disabled = false,
  loading = false,
  icon = null,
  iconRight = null,
  fullWidth = false,
  style = {},
  onClick,
  ...rest
}) {
  const s = SIZES[size] || SIZES.lg;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: s.height,
    minHeight: 44,
    padding: s.padding,
    borderRadius: "var(--r-pill)",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: s.font,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: 1,
    whiteSpace: "nowrap",
    width: fullWidth ? "100%" : "auto",
    transition: "box-shadow var(--dur-standard) var(--ease-standard), transform var(--dur-micro) var(--ease-standard), background var(--dur-standard) var(--ease-standard)",
    transform: press && !disabled ? "scale(0.97)" : "scale(1)"
  };
  let visual;
  if (disabled) {
    visual = {
      background: "var(--canvas-sunken)",
      color: "var(--text-disabled)",
      boxShadow: "none"
    };
  } else if (variant === "ghost") {
    visual = {
      background: hover ? "var(--neutral-bg)" : "transparent",
      color: v.color,
      boxShadow: "none"
    };
  } else {
    const bg = variant === "primary" && hover ? "var(--action-primary-hover)" : variant === "destructive" && hover ? "#d83c41" : v.bg;
    visual = {
      background: bg,
      color: v.color,
      boxShadow: hover ? v.hoverShadow : v.shadow
    };
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    style: {
      ...base,
      ...visual,
      ...style
    },
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false)
  }, rest), loading ? /*#__PURE__*/React.createElement(Spinner, null) : /*#__PURE__*/React.createElement(React.Fragment, null, icon, children, iconRight));
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.35)",
      borderTopColor: "#fff",
      display: "inline-block",
      animation: "hg-spin 0.7s linear infinite"
    }
  }, /*#__PURE__*/React.createElement("style", null, "@keyframes hg-spin{to{transform:rotate(360deg)}}"));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/** 20px checkbox. Unchecked = white + e1, checked = accent fill + white check. */
function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  style = {},
  id
}) {
  const cid = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: cid,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 6,
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: disabled ? "var(--canvas-sunken)" : checked ? "var(--accent)" : "var(--surface)",
      boxShadow: checked || disabled ? "none" : "var(--e1)",
      transition: "background var(--dur-micro) var(--ease-standard)"
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none",
    stroke: disabled ? "var(--text-disabled)" : "#fff",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 6.5L5 9l4.5-5"
  }))), /*#__PURE__*/React.createElement("input", {
    id: cid,
    type: "checkbox",
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: disabled ? "var(--text-disabled)" : "var(--text-primary)"
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Perfect-circle icon button. White fill + e1 at rest. */
function IconButton({
  children,
  size = 40,
  label,
  variant = "surface",
  disabled = false,
  style = {},
  onClick,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const variants = {
    surface: {
      bg: "var(--surface)",
      color: "var(--text-primary)",
      shadow: "var(--e1)"
    },
    dark: {
      bg: "var(--action-primary)",
      color: "#fff",
      shadow: "none"
    },
    ghost: {
      bg: hover ? "var(--neutral-bg)" : "transparent",
      color: "var(--text-secondary)",
      shadow: "none"
    }
  };
  const v = variants[variant] || variants.surface;
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      width: size,
      height: size,
      minWidth: 44,
      minHeight: 44,
      borderRadius: "50%",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: disabled ? "var(--canvas-sunken)" : v.bg,
      color: disabled ? "var(--text-disabled)" : v.color,
      boxShadow: disabled ? "none" : hover && variant === "surface" ? "var(--e2)" : v.shadow,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "box-shadow var(--dur-standard) var(--ease-standard), transform var(--dur-micro) var(--ease-standard)",
      transform: press && !disabled ? "scale(0.94)" : "scale(1)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Borderless input. No border at rest — e1 shadow. Focus = 2px accent ring, no border appears. */
function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  density = "expressive",
  error,
  success,
  helper,
  disabled = false,
  mono = false,
  leading = null,
  trailing = null,
  style = {},
  id,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const fieldId = id || React.useId();
  const isExpr = density === "expressive";
  const ringColor = error ? "var(--danger)" : success ? "var(--success)" : null;
  const wrap = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: isExpr ? 52 : 40,
    padding: "0 16px",
    background: disabled ? "var(--canvas-sunken)" : isExpr ? "var(--surface)" : "var(--surface-alt)",
    borderRadius: isExpr ? "var(--r-input-expressive)" : "var(--r-input-functional)",
    boxShadow: disabled ? "none" : focus ? "var(--e2), 0 0 0 2px var(--surface), 0 0 0 4px var(--accent)" : ringColor ? `inset 0 0 0 1.5px ${ringColor}, var(--e1)` : "var(--e1)",
    transition: "box-shadow var(--dur-standard) var(--ease-standard)"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--text-secondary)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: wrap
  }, leading, /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
      fontSize: 15,
      color: disabled ? "var(--text-disabled)" : "var(--text-primary)",
      fontVariantNumeric: "tabular-nums"
    }
  }, rest)), trailing), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--danger)"
    }
  }, error) : helper ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-tertiary)"
    }
  }, helper) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
/** 20px radio. Checked = accent ring + accent dot. */
function Radio({
  checked = false,
  onChange,
  label,
  name,
  value,
  disabled = false,
  style = {},
  id
}) {
  const rid = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: rid,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: "50%",
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--surface)",
      boxShadow: disabled ? "none" : checked ? "inset 0 0 0 2px var(--accent)" : "var(--e1)",
      transition: "box-shadow var(--dur-micro) var(--ease-standard)"
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: disabled ? "var(--text-disabled)" : "var(--accent)"
    }
  })), /*#__PURE__*/React.createElement("input", {
    id: rid,
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: disabled ? "var(--text-disabled)" : "var(--text-primary)"
    }
  }, label));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** 52x32 switch. Track canvas-sunken -> accent. Thumb white circle + e2, spring easing. */
function Switch({
  checked = false,
  onChange,
  label,
  disabled = false,
  style = {},
  id
}) {
  const sid = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: sid,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      cursor: disabled ? "not-allowed" : "pointer",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 52,
      height: 32,
      borderRadius: "var(--r-pill)",
      flexShrink: 0,
      position: "relative",
      background: disabled ? "var(--canvas-sunken)" : checked ? "var(--accent)" : "var(--canvas-sunken)",
      transition: "background var(--dur-standard) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 4,
      left: checked ? 24 : 4,
      width: 24,
      height: 24,
      borderRadius: "50%",
      background: "#fff",
      boxShadow: "var(--e2)",
      transition: "left var(--dur-standard) var(--ease-spring)"
    }
  })), /*#__PURE__*/React.createElement("input", {
    id: sid,
    type: "checkbox",
    role: "switch",
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: disabled ? "var(--text-disabled)" : "var(--text-primary)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedControl.jsx
try { (() => {
/** Segmented control — pill container on canvas-sunken, active is a white pill (e2), spring slide. */
function SegmentedControl({
  options = [],
  value,
  onChange,
  style = {}
}) {
  const idx = Math.max(0, options.findIndex(o => (o.value ?? o) === value));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      position: "relative",
      padding: 4,
      background: "var(--canvas-sunken)",
      borderRadius: "var(--r-pill)",
      gap: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 4,
      bottom: 4,
      left: `calc(4px + ${idx} * (100% - 8px) / ${options.length})`,
      width: `calc((100% - 8px) / ${options.length})`,
      background: "var(--surface)",
      borderRadius: "var(--r-pill)",
      boxShadow: "var(--e2)",
      transition: "left var(--dur-emphasised) var(--ease-spring)"
    }
  }), options.map(o => {
    const v = o.value ?? o,
      label = o.label ?? o;
    const active = v === value;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      onClick: () => onChange && onChange(v),
      style: {
        position: "relative",
        zIndex: 1,
        flex: 1,
        border: "none",
        background: "transparent",
        padding: "0 18px",
        height: 32,
        borderRadius: "var(--r-pill)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: 13,
        fontWeight: 500,
        whiteSpace: "nowrap",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        transition: "color var(--dur-standard) var(--ease-standard)"
      }
    }, label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/** Underline tabs — 2px accent indicator slides between tabs, no border rule. */
function Tabs({
  tabs = [],
  value,
  onChange,
  style = {}
}) {
  const refs = React.useRef({});
  const [ind, setInd] = React.useState({
    left: 0,
    width: 0
  });
  React.useEffect(() => {
    const el = refs.current[value];
    if (el) setInd({
      left: el.offsetLeft,
      width: el.offsetWidth
    });
  }, [value, tabs]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      gap: 28,
      ...style
    }
  }, tabs.map(t => {
    const v = t.value ?? t,
      label = t.label ?? t;
    const active = v === value;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      ref: el => refs.current[v] = el,
      onClick: () => onChange && onChange(v),
      style: {
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: "0 0 12px",
        fontFamily: "var(--font-sans)",
        fontSize: 15,
        fontWeight: active ? 500 : 400,
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        whiteSpace: "nowrap",
        transition: "color var(--dur-standard) var(--ease-standard)"
      }
    }, label);
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      bottom: 0,
      height: 2,
      borderRadius: 2,
      background: "var(--accent)",
      left: ind.left,
      width: ind.width,
      transition: "left var(--dur-emphasised) var(--ease-standard), width var(--dur-emphasised) var(--ease-standard)"
    }
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desktop/screens.jsx
try { (() => {
(function () {
  /* HelioGrid desktop screens: pipeline data table (functional), kanban, master-detail. */
  const D = window.HGDesktop;
  const {
    Sidebar,
    Header,
    Button,
    IconButton,
    Input,
    Card,
    IconCircle,
    StatCard,
    StatusChip,
    Chip,
    Badge,
    Avatar,
    AvatarGroup,
    SegmentedControl,
    Checkbox,
    icons
  } = D;
  const {
    IcSun,
    IcChevronD,
    IcX,
    IcPlus
  } = icons;
  const Overline = ({
    children,
    style
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      ...style
    }
  }, children);
  const ROWS = [{
    id: "HG-4821",
    name: "Sharma residence",
    city: "Pune",
    kwp: "8.4",
    status: "design-in-progress",
    rep: "Priya S",
    amt: "₹4,52,471"
  }, {
    id: "HG-4820",
    name: "Kulkarni farmhouse",
    city: "Nashik",
    kwp: "12.0",
    status: "survey-scheduled",
    rep: "Amit R",
    amt: "₹6,80,000"
  }, {
    id: "HG-4816",
    name: "Deshmukh textiles",
    city: "Aurangabad",
    kwp: "48.0",
    status: "approved",
    rep: "Kiran M",
    amt: "₹28,40,000"
  }, {
    id: "HG-4809",
    name: "Patil residence",
    city: "Kolhapur",
    kwp: "5.2",
    status: "commissioned",
    rep: "Deep N",
    amt: "₹2,90,000"
  }, {
    id: "HG-4805",
    name: "Joshi bungalow",
    city: "Pune",
    kwp: "10.0",
    status: "lead",
    rep: "Sana Q",
    amt: "₹5,10,000"
  }, {
    id: "HG-4798",
    name: "Iyer villa",
    city: "Solapur",
    kwp: "7.6",
    status: "installing",
    rep: "Priya S",
    amt: "₹4,10,000"
  }, {
    id: "HG-4790",
    name: "Rao residence",
    city: "Pune",
    kwp: "6.0",
    status: "on-hold",
    rep: "Amit R",
    amt: "₹3,30,000"
  }];
  function DataTable({
    onOpen
  }) {
    const [sel, setSel] = React.useState([]);
    const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    const allSel = sel.length === ROWS.length;
    const th = {
      padding: "10px 12px",
      fontSize: 12,
      fontWeight: 500,
      color: "var(--text-secondary)",
      background: "var(--canvas)",
      textAlign: "left",
      position: "sticky",
      top: 0,
      whiteSpace: "nowrap"
    };
    const td = {
      padding: "0 12px",
      fontSize: 13,
      height: 48,
      color: "var(--text-primary)",
      verticalAlign: "middle"
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        background: "var(--surface)",
        borderRadius: 12,
        boxShadow: "var(--e2)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("table", {
      style: {
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: "var(--font-sans)"
      }
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
      style: {
        ...th,
        width: 44,
        paddingLeft: 16
      }
    }, /*#__PURE__*/React.createElement(Checkbox, {
      checked: allSel,
      onChange: () => setSel(allSel ? [] : ROWS.map(r => r.id))
    })), /*#__PURE__*/React.createElement("th", {
      style: th
    }, "Job"), /*#__PURE__*/React.createElement("th", {
      style: th
    }, "ID"), /*#__PURE__*/React.createElement("th", {
      style: th
    }, "City"), /*#__PURE__*/React.createElement("th", {
      style: {
        ...th,
        textAlign: "right"
      }
    }, "Capacity"), /*#__PURE__*/React.createElement("th", {
      style: {
        ...th,
        textAlign: "center"
      }
    }, "Status"), /*#__PURE__*/React.createElement("th", {
      style: th
    }, "Rep"), /*#__PURE__*/React.createElement("th", {
      style: {
        ...th,
        textAlign: "right",
        paddingRight: 20
      }
    }, "Value"))), /*#__PURE__*/React.createElement("tbody", null, ROWS.map((r, i) => {
      const isSel = sel.includes(r.id);
      return /*#__PURE__*/React.createElement("tr", {
        key: r.id,
        onClick: () => onOpen(r),
        style: {
          cursor: "pointer",
          background: isSel ? "var(--accent-subtle)" : i % 2 ? "var(--surface-alt)" : "var(--surface)"
        },
        onMouseEnter: e => {
          if (!isSel) e.currentTarget.style.background = "var(--neutral-bg)";
        },
        onMouseLeave: e => {
          if (!isSel) e.currentTarget.style.background = i % 2 ? "var(--surface-alt)" : "var(--surface)";
        }
      }, /*#__PURE__*/React.createElement("td", {
        style: {
          ...td,
          paddingLeft: 16
        },
        onClick: e => e.stopPropagation()
      }, /*#__PURE__*/React.createElement(Checkbox, {
        checked: isSel,
        onChange: () => toggle(r.id)
      })), /*#__PURE__*/React.createElement("td", {
        style: td
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10
        }
      }, /*#__PURE__*/React.createElement(IconCircle, {
        color: "var(--warning)",
        size: 32
      }, /*#__PURE__*/React.createElement(IcSun, {
        size: 16
      })), /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 700,
          letterSpacing: "-0.01em"
        }
      }, r.name))), /*#__PURE__*/React.createElement("td", {
        style: {
          ...td,
          fontFamily: "var(--font-mono)",
          color: "var(--text-secondary)"
        }
      }, r.id), /*#__PURE__*/React.createElement("td", {
        style: {
          ...td,
          color: "var(--text-secondary)"
        }
      }, r.city), /*#__PURE__*/React.createElement("td", {
        style: {
          ...td,
          textAlign: "right",
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums"
        }
      }, r.kwp, " kWp"), /*#__PURE__*/React.createElement("td", {
        style: {
          ...td,
          textAlign: "center"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "inline-flex"
        }
      }, /*#__PURE__*/React.createElement(StatusChip, {
        status: r.status,
        density: "functional"
      }))), /*#__PURE__*/React.createElement("td", {
        style: {
          ...td,
          color: "var(--text-secondary)"
        }
      }, r.rep), /*#__PURE__*/React.createElement("td", {
        style: {
          ...td,
          textAlign: "right",
          paddingRight: 20,
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums"
        }
      }, r.amt));
    }))), sel.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "var(--surface)",
        borderRadius: 999,
        boxShadow: "var(--e5)",
        padding: "8px 8px 8px 20px",
        zIndex: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500
      }
    }, sel.length, " selected"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Assign rep"), /*#__PURE__*/React.createElement(Button, {
      size: "sm"
    }, "Export"), /*#__PURE__*/React.createElement(IconButton, {
      label: "Clear",
      size: 32,
      variant: "ghost",
      onClick: () => setSel([])
    }, /*#__PURE__*/React.createElement(IcX, {
      size: 16
    }))));
  }
  const COLS = [{
    key: "lead",
    label: "Lead",
    status: "lead",
    items: ["Joshi bungalow", "Mehta duplex"]
  }, {
    key: "survey",
    label: "Survey",
    status: "survey-scheduled",
    items: ["Kulkarni farmhouse"]
  }, {
    key: "design",
    label: "Design",
    status: "design-in-progress",
    items: ["Sharma residence", "Iyer villa"]
  }, {
    key: "install",
    label: "Installing",
    status: "installing",
    items: ["Deshmukh textiles"]
  }];
  function Kanban() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        overflowX: "auto",
        paddingBottom: 8
      }
    }, COLS.map(c => /*#__PURE__*/React.createElement("div", {
      key: c.key,
      style: {
        width: 260,
        flexShrink: 0,
        background: "var(--canvas-sunken)",
        borderRadius: 12,
        padding: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 6px 10px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(StatusChip, {
      status: c.status,
      density: "functional",
      label: c.label
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--text-tertiary)",
        fontVariantNumeric: "tabular-nums"
      }
    }, c.items.length)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, c.items.map((n, i) => /*#__PURE__*/React.createElement(Card, {
      key: i,
      density: "functional",
      interactive: true,
      style: {
        padding: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        marginBottom: 6
      }
    }, n), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--text-secondary)"
      }
    }, "Pune \xB7 8.4 kWp"), /*#__PURE__*/React.createElement(Avatar, {
      name: "R K",
      size: 24
    }))))))));
  }
  function Pipeline() {
    const [mode, setMode] = React.useState("table");
    const [open, setOpen] = React.useState(null);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 24px 24px",
        flex: 1,
        overflowY: "auto"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Overline, null, "SunVolt Energy \xB7 Maharashtra"), /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: "6px 0 0",
        fontSize: 32,
        fontWeight: 700,
        letterSpacing: "-0.025em"
      }
    }, "Pipeline")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement(SegmentedControl, {
      value: mode,
      onChange: setMode,
      options: [{
        value: "table",
        label: "Table"
      }, {
        value: "kanban",
        label: "Kanban"
      }]
    }), /*#__PURE__*/React.createElement(Button, {
      icon: /*#__PURE__*/React.createElement(IcPlus, {
        size: 18
      })
    }, "New job"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 12,
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      label: "Pipeline value",
      value: "\u20B91.24",
      unit: "Cr",
      delta: "12%",
      deltaDir: "up"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Open jobs",
      value: "34",
      delta: "4",
      deltaDir: "up"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Won this month",
      value: "248",
      unit: "kWp",
      delta: "8%",
      deltaDir: "up"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Avg. cycle",
      value: "21",
      unit: "days",
      delta: "3%",
      deltaDir: "down"
    })), mode === "table" ? /*#__PURE__*/React.createElement(DataTable, {
      onOpen: setOpen
    }) : /*#__PURE__*/React.createElement(Kanban, null), open && /*#__PURE__*/React.createElement(DetailPanel, {
      row: open,
      onClose: () => setOpen(null)
    }));
  }

  /* Master-detail: right panel over a blurred backdrop (never dark). */
  function DetailPanel({
    row,
    onClose
  }) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      onClick: onClose,
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(246,247,249,0.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 50
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 480,
        background: "var(--surface)",
        boxShadow: "var(--e5)",
        zIndex: 51,
        padding: 32,
        overflowY: "auto",
        animation: "hgSlide var(--dur-emphasised) var(--ease-standard)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 14,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement(IconCircle, {
      color: "var(--warning)",
      size: 48
    }, /*#__PURE__*/React.createElement(IcSun, {
      size: 22
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: 0,
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: "-0.02em"
      }
    }, row.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        color: "var(--text-secondary)"
      }
    }, row.id, " \xB7 ", row.city))), /*#__PURE__*/React.createElement(IconButton, {
      label: "Close",
      onClick: onClose
    }, /*#__PURE__*/React.createElement(IcX, {
      size: 20
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement(StatusChip, {
      status: row.status
    })), /*#__PURE__*/React.createElement(Overline, {
      style: {
        marginTop: 28,
        marginBottom: 12
      }
    }, "System"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      label: "DC capacity",
      value: row.kwp,
      unit: "kWp"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Quote value",
      value: row.amt
    })), /*#__PURE__*/React.createElement(Overline, {
      style: {
        marginTop: 28,
        marginBottom: 12
      }
    }, "Bill of materials"), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--surface-alt)",
        borderRadius: 12,
        overflow: "hidden"
      }
    }, [["Mono PERC module 545W", "×16", "₹1,74,400"], ["String inverter 8 kW", "×1", "₹62,000"], ["Mounting structure (MMS)", "8.4 kWp", "₹58,800"], ["BOS + cabling", "—", "₹41,200"]].map((r, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: i % 2 ? "var(--surface)" : "transparent",
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement("span", null, r[0]), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        gap: 20
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-tertiary)",
        fontFamily: "var(--font-mono)"
      }
    }, r[1]), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums"
      }
    }, r[2]))))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        marginTop: 28
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      fullWidth: true
    }, "Edit design"), /*#__PURE__*/React.createElement(Button, {
      fullWidth: true
    }, "Send over WhatsApp"))));
  }
  window.HGDesktopScreens = {
    Pipeline
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desktop/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desktop/shell.jsx
try { (() => {
(function () {
  /* HelioGrid desktop web — functional density. Fixed sidebar + header, data table, kanban, master-detail.
     Composes DS primitives. Still no borders — rows separate by alternating luminance. */
  const NS = window.HelioGridDesignSystem_c8aa43;
  const {
    Button,
    IconButton,
    Input,
    Card,
    IconCircle,
    StatCard,
    StatusChip,
    Chip,
    Badge,
    Avatar,
    AvatarGroup,
    SegmentedControl,
    Tabs,
    Checkbox
  } = NS;
  const I = paths => props => /*#__PURE__*/React.createElement("svg", {
    width: props?.size || 20,
    height: props?.size || 20,
    viewBox: "0 0 24 24",
    fill: props?.fill || "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: props?.style
  }, paths);
  const IcDash = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "9",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "5",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "12",
    width: "7",
    height: "9",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "16",
    width: "7",
    height: "5",
    rx: "1.5"
  })));
  const IcPipe = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M6 12h12M9 18h6"
  })));
  const IcDesign = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m12 2 9 5-9 5-9-5 9-5z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3 12 9 5 9-5"
  })));
  const IcBox = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 8 12 3 3 8v8l9 5 9-5V8z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 8l9 5 9-5M12 13v8"
  })));
  const IcReport = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 20V10M10 20V4M16 20v-7M22 20H2"
  })));
  const IcSettings = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"
  })));
  const IcBell = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10.3 21a1.9 1.9 0 0 0 3.4 0"
  })));
  const IcSearch = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })));
  const IcSun = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2M12 20v2M4 12H2M22 12h-2M6 6 4.5 4.5M19.5 19.5 18 18M18 6l1.5-1.5M4.5 19.5 6 18"
  })));
  const IcChevronD = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  })));
  const IcX = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })));
  const IcPlus = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })));
  const NAV = [{
    group: "Sales",
    items: [{
      k: "dashboard",
      label: "Dashboard",
      Ic: IcDash
    }, {
      k: "pipeline",
      label: "Pipeline",
      Ic: IcPipe
    }, {
      k: "designs",
      label: "Designs",
      Ic: IcDesign
    }]
  }, {
    group: "Operations",
    items: [{
      k: "inventory",
      label: "Inventory",
      Ic: IcBox
    }, {
      k: "reports",
      label: "Reports",
      Ic: IcReport
    }, {
      k: "settings",
      label: "Settings",
      Ic: IcSettings
    }]
  }];
  function Sidebar({
    view,
    setView
  }) {
    return /*#__PURE__*/React.createElement("aside", {
      style: {
        width: 260,
        flexShrink: 0,
        background: "var(--canvas)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "20px 16px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "4px 8px 24px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 32,
        height: 32,
        borderRadius: 10,
        background: "var(--gradient-brand)",
        boxShadow: "var(--e2)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: "-0.03em"
      }
    }, "HelioGrid")), NAV.map(g => /*#__PURE__*/React.createElement("div", {
      key: g.group,
      style: {
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--text-tertiary)",
        padding: "0 8px 8px"
      }
    }, g.group), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 2
      }
    }, g.items.map(({
      k,
      label,
      Ic
    }) => {
      const active = view === k;
      return /*#__PURE__*/React.createElement("button", {
        key: k,
        onClick: () => setView(k),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: "none",
          cursor: "pointer",
          padding: "8px 10px",
          borderRadius: 999,
          background: active ? "var(--accent-subtle)" : "transparent",
          color: active ? "var(--accent)" : "var(--text-secondary)",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: active ? 500 : 400,
          textAlign: "left"
        }
      }, /*#__PURE__*/React.createElement(Ic, {
        size: 20
      }), " ", label);
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: "auto",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 8,
        background: "var(--surface)",
        borderRadius: 12,
        boxShadow: "var(--e1)"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Amit Rao",
      size: 32
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, "Amit Rao"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-tertiary)"
      }
    }, "SunVolt Energy"))));
  }
  function Header({
    crumbs = []
  }) {
    return /*#__PURE__*/React.createElement("header", {
      style: {
        height: 64,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 24px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 14
      }
    }, crumbs.map((c, i) => /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: i === crumbs.length - 1 ? "var(--text-primary)" : "var(--text-tertiary)",
        fontWeight: i === crumbs.length - 1 ? 500 : 400
      }
    }, c), i < crumbs.length - 1 && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-disabled)"
      }
    }, "/")))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        maxWidth: 420,
        margin: "0 auto"
      }
    }, /*#__PURE__*/React.createElement(Input, {
      density: "functional",
      placeholder: "Search   \u2318K",
      leading: /*#__PURE__*/React.createElement(IcSearch, {
        size: 18,
        style: {
          color: "var(--text-tertiary)"
        }
      })
    })), /*#__PURE__*/React.createElement(IconButton, {
      label: "Notifications",
      size: 40
    }, /*#__PURE__*/React.createElement(IcBell, {
      size: 20
    })), /*#__PURE__*/React.createElement(Avatar, {
      name: "Amit Rao",
      size: 36
    }));
  }
  window.HGDesktop = {
    NS,
    Sidebar,
    Header,
    Button,
    IconButton,
    Input,
    Card,
    IconCircle,
    StatCard,
    StatusChip,
    Chip,
    Badge,
    Avatar,
    AvatarGroup,
    SegmentedControl,
    Tabs,
    Checkbox,
    icons: {
      IcDash,
      IcPipe,
      IcDesign,
      IcBox,
      IcReport,
      IcSettings,
      IcBell,
      IcSearch,
      IcSun,
      IcChevronD,
      IcX,
      IcPlus
    }
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desktop/shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/overlays.jsx
try { (() => {
(function () {
  /* HelioGrid mobile overlays: lead detail bottom sheet + new-quote survey flow. */
  const O = window.HGMobile;
  const {
    Card,
    IconCircle,
    StatusChip,
    Chip,
    Badge,
    Button,
    IconButton,
    Input,
    ProgressBar,
    Toast,
    icons,
    StatCard
  } = O;
  const {
    IcSun,
    IcMap,
    IcCamera,
    IcRupee,
    IcX,
    IcChevron,
    IcPlus
  } = icons;
  const Overline = window.HGMobileScreens.Overline;

  /* Backdrop blurs + fades to white — never darkens. */
  function SheetBackdrop({
    onClose
  }) {
    return /*#__PURE__*/React.createElement("div", {
      onClick: onClose,
      style: {
        position: "absolute",
        inset: 0,
        background: "rgba(246,247,249,0.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 40,
        animation: "hgFade var(--dur-standard) var(--ease-enter)"
      }
    });
  }
  function Sheet({
    children,
    onClose
  }) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SheetBackdrop, {
      onClose: onClose
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 41,
        background: "var(--surface)",
        borderRadius: "32px 32px 0 0",
        boxShadow: "var(--e5)",
        maxHeight: "92%",
        display: "flex",
        flexDirection: "column",
        animation: "hgSheet var(--dur-emphasised) var(--ease-spring)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        placeItems: "center",
        paddingTop: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 4,
        borderRadius: 999,
        background: "var(--canvas-sunken)"
      }
    })), children));
  }
  function LeadSheet({
    lead,
    onClose,
    onQuote
  }) {
    return /*#__PURE__*/React.createElement(Sheet, {
      onClose: onClose
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        overflowY: "auto",
        padding: "12px 20px 24px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement(IconCircle, {
      color: lead.color,
      size: 56
    }, /*#__PURE__*/React.createElement(IcSun, {
      size: 26
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: 0,
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: "-0.02em"
      }
    }, lead.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        color: "var(--text-secondary)"
      }
    }, lead.sub))), /*#__PURE__*/React.createElement(IconButton, {
      label: "Close",
      onClick: onClose
    }, /*#__PURE__*/React.createElement(IcX, {
      size: 20
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement(StatusChip, {
      status: lead.status
    })), /*#__PURE__*/React.createElement(Overline, {
      style: {
        marginTop: 28,
        marginBottom: 12
      }
    }, "System capacity"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      label: "DC capacity",
      value: "8.4",
      unit: "kWp"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Est. generation",
      value: "34",
      unit: "kWh/d"
    })), /*#__PURE__*/React.createElement(Overline, {
      style: {
        marginTop: 28,
        marginBottom: 12
      }
    }, "Site survey"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(TimelineRow, {
      done: true,
      label: "Lead captured",
      meta: "10 Mar"
    }), /*#__PURE__*/React.createElement(TimelineRow, {
      done: true,
      label: "Site surveyed",
      meta: "11 Mar \xB7 12 photos"
    }), /*#__PURE__*/React.createElement(TimelineRow, {
      current: true,
      label: "Design in progress",
      meta: "Assigned to Priya"
    }), /*#__PURE__*/React.createElement(TimelineRow, {
      label: "Quote sent"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        marginTop: 28
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      fullWidth: true,
      icon: /*#__PURE__*/React.createElement(IcMap, {
        size: 18
      })
    }, "Directions"), /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      icon: /*#__PURE__*/React.createElement(IcRupee, {
        size: 18
      }),
      onClick: onQuote
    }, "Build quote"))));
  }
  function TimelineRow({
    done,
    current,
    label,
    meta
  }) {
    const color = done ? "var(--success)" : current ? "var(--accent)" : "var(--canvas-sunken)";
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: done || current ? color : "var(--surface)",
        boxShadow: done || current ? current ? "0 0 0 4px var(--accent-subtle)" : "none" : "inset 0 0 0 2px var(--canvas-sunken)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }
    }, done && /*#__PURE__*/React.createElement("svg", {
      width: "11",
      height: "11",
      viewBox: "0 0 12 12",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M2.5 6.5 5 9l4.5-5"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: current ? 700 : 400,
        color: done || current ? "var(--text-primary)" : "var(--text-tertiary)"
      }
    }, label)), meta && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--text-tertiary)"
      }
    }, meta));
  }

  /* New-quote survey flow — 2 steps, optimistic finish w/ toast. */
  function NewQuote({
    onClose,
    onDone
  }) {
    const [step, setStep] = React.useState(1);
    return /*#__PURE__*/React.createElement(Sheet, {
      onClose: onClose
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        overflowY: "auto",
        padding: "12px 20px 24px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement(Overline, null, "New quote \xB7 step ", step, " of 2"), /*#__PURE__*/React.createElement(IconButton, {
      label: "Close",
      onClick: onClose
    }, /*#__PURE__*/React.createElement(IcX, {
      size: 20
    }))), /*#__PURE__*/React.createElement(ProgressBar, {
      value: step === 1 ? 50 : 100,
      style: {
        margin: "12px 0 24px"
      }
    }), step === 1 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: "0 0 20px",
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: "-0.02em"
      }
    }, "Site details"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Customer name",
      placeholder: "e.g. Rajesh Kumar"
    }), /*#__PURE__*/React.createElement(Input, {
      label: "City / DISCOM",
      placeholder: "Pune \xB7 MSEDCL"
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Sanctioned load",
      mono: true,
      trailing: /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13,
          color: "var(--text-tertiary)"
        }
      }, "kW"),
      placeholder: "5"
    }))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: "0 0 20px",
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: "-0.02em"
      }
    }, "Roof photos"), /*#__PURE__*/React.createElement("div", {
      style: {
        border: "1.5px dashed var(--text-disabled)",
        borderRadius: 16,
        background: "var(--surface-alt)",
        padding: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        color: "var(--text-tertiary)"
      }
    }, /*#__PURE__*/React.createElement(IcCamera, {
      size: 28
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        color: "var(--text-primary)"
      }
    }, "Add roof photos"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13
      }
    }, "Tap to capture or upload"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        marginTop: 28
      }
    }, step === 2 && /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      fullWidth: true,
      onClick: () => setStep(1)
    }, "Back"), /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      onClick: () => step === 1 ? setStep(2) : onDone()
    }, step === 1 ? "Next" : "Create quote"))));
  }
  window.HGMobileOverlays = {
    LeadSheet,
    NewQuote,
    Sheet
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/overlays.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/screens.jsx
try { (() => {
(function () {
  /* HelioGrid mobile screens. Loaded after shell.jsx. Reads window.HGMobile. */
  const M = window.HGMobile;
  const {
    StatusBar,
    TopBar,
    BottomNav,
    Avatar,
    Card,
    IconCircle,
    StatCard,
    StatusChip,
    Chip,
    Badge,
    ListRow,
    Button,
    IconButton,
    Input,
    EmptyState,
    OfflineBanner,
    ProgressBar,
    SegmentedControl,
    icons
  } = M;
  const {
    IcSun,
    IcMap,
    IcCamera,
    IcRupee,
    IcChevron,
    IcSearch,
    IcX,
    IcSparkle,
    IcPlus
  } = icons;
  const Overline = ({
    children,
    style
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      ...style
    }
  }, children);
  const LEADS = [{
    name: "Sharma residence",
    sub: "8.4 kWp · Pune",
    status: "design-in-progress",
    color: "var(--warning)",
    amt: "₹4,52,471"
  }, {
    name: "Kulkarni farmhouse",
    sub: "12.0 kWp · Nashik",
    status: "survey-scheduled",
    color: "var(--info)",
    amt: "₹6,80,000"
  }, {
    name: "Deshmukh textiles",
    sub: "48 kWp commercial · Aurangabad",
    status: "approved",
    color: "var(--accent)",
    amt: "₹28,40,000"
  }, {
    name: "Patil residence",
    sub: "5.2 kWp · Kolhapur",
    status: "commissioned",
    color: "var(--success)",
    amt: "₹2,90,000"
  }, {
    name: "Joshi bungalow",
    sub: "10.0 kWp · Pune",
    status: "lead",
    color: "var(--neutral)",
    amt: "₹5,10,000"
  }];

  /* ---- Home / dashboard ---- */
  function Home({
    openLead
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        flex: 1,
        overflowY: "auto",
        padding: "4px 20px 24px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: -40,
        left: "50%",
        transform: "translateX(-50%)",
        width: 320,
        height: 240,
        background: "var(--glow-brand)",
        pointerEvents: "none",
        zIndex: 0
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        zIndex: 1
      }
    }, /*#__PURE__*/React.createElement(Overline, {
      style: {
        marginTop: 8
      }
    }, "Tuesday, 12 Mar"), /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: "6px 0 20px",
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: "-0.03em",
        color: "var(--text-primary)",
        textWrap: "pretty"
      }
    }, "Good morning, Amit"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      label: "Pipeline",
      value: "\u20B91.24",
      unit: "Cr",
      delta: "12%",
      deltaDir: "up"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "This month",
      value: "248",
      unit: "kWp",
      delta: "8%",
      deltaDir: "up"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "24px 0 12px"
      }
    }, /*#__PURE__*/React.createElement(Overline, null, "Active jobs"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--accent)",
        fontWeight: 500
      }
    }, "See all")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, LEADS.slice(0, 3).map((l, i) => /*#__PURE__*/React.createElement(Card, {
      key: i,
      interactive: true,
      onClick: () => openLead(l),
      style: {
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(IconCircle, {
      color: l.color
    }, /*#__PURE__*/React.createElement(IcSun, {
      size: 20
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "-0.01em"
      }
    }, l.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "var(--text-secondary)"
      }
    }, l.sub)), /*#__PURE__*/React.createElement(StatusChip, {
      status: l.status,
      density: "functional"
    }))))));
  }

  /* ---- Pipeline (discovery grid + filter chips + search) ---- */
  function Pipeline({
    openLead
  }) {
    const [filter, setFilter] = React.useState("All");
    const [q, setQ] = React.useState("");
    const chips = ["All", "New", "Survey", "Design", "Installing"];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: "0 20px 24px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        margin: "4px 0 16px"
      }
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "Search jobs, customers, cities",
      value: q,
      onChange: e => setQ(e.target.value),
      leading: /*#__PURE__*/React.createElement(IcSearch, {
        size: 18,
        style: {
          color: "var(--text-tertiary)"
        }
      }),
      style: {
        flex: 1
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 4,
        marginBottom: 16
      }
    }, chips.map(c => /*#__PURE__*/React.createElement(Chip, {
      key: c,
      active: filter === c,
      onClick: () => setFilter(c)
    }, c))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, LEADS.map((l, i) => /*#__PURE__*/React.createElement(Card, {
      key: i,
      interactive: true,
      onClick: () => openLead(l),
      style: {
        padding: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(IconCircle, {
      color: l.color
    }, /*#__PURE__*/React.createElement(IcSun, {
      size: 20
    })), /*#__PURE__*/React.createElement(StatusChip, {
      status: l.status,
      density: "functional"
    })), /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: "14px 0 2px",
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: "-0.015em"
      }
    }, l.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "var(--text-secondary)"
      }
    }, l.sub), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        fontVariantNumeric: "tabular-nums"
      }
    }, l.amt), /*#__PURE__*/React.createElement(IcChevron, {
      size: 20,
      style: {
        color: "var(--text-tertiary)"
      }
    }))))));
  }

  /* ---- Designs (empty state demo) ---- */
  function Designs() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 20px"
      }
    }, /*#__PURE__*/React.createElement(EmptyState, {
      icon: /*#__PURE__*/React.createElement(IcSun, {
        size: 30
      }),
      title: "No saved designs",
      description: "Designs you generate for a site will appear here, ready to turn into a quote.",
      action: /*#__PURE__*/React.createElement(Button, {
        icon: /*#__PURE__*/React.createElement(IcPlus, {
          size: 18
        })
      }, "New design")
    }));
  }

  /* ---- Profile ---- */
  function Me() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: "8px 20px 24px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "20px 0"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Amit Rao",
      size: 80
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: "-0.015em"
      }
    }, "Amit Rao"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "var(--text-secondary)"
      }
    }, "Sales rep \xB7 SunVolt Energy, Pune"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 8
      }
    }, [["Team", "6 reps"], ["DISCOM presets", "MSEDCL"], ["GST profile", "27ABCDE1234F1Z5"], ["High-contrast field mode", "Off"]].map(([k, v], i) => /*#__PURE__*/React.createElement(ListRow, {
      key: i,
      density: "functional",
      title: k,
      subtitle: v,
      trailing: /*#__PURE__*/React.createElement(IcChevron, {
        size: 18,
        style: {
          color: "var(--text-tertiary)"
        }
      }),
      onClick: () => {},
      style: {
        background: "var(--surface)",
        boxShadow: "var(--e1)"
      }
    }))));
  }
  window.HGMobileScreens = {
    Home,
    Pipeline,
    Designs,
    Me,
    LEADS,
    Overline
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/shell.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
(function () {
  /* HelioGrid mobile app — full click-through. Composes DS primitives from the bundle.
     Signature: raised gradient nav object, ambient bloom, floating no-border cards, bottom sheet. */
  const NS = window.HelioGridDesignSystem_c8aa43;
  const {
    Button,
    IconButton,
    Input,
    Card,
    IconCircle,
    StatCard,
    StatusChip,
    Chip,
    Badge,
    Avatar,
    ListRow,
    EmptyState,
    OfflineBanner,
    ProgressBar,
    Toast,
    SegmentedControl
  } = NS;

  /* ---- Lucide-style icon helper (1.5 stroke, round caps) ---- */
  const I = (paths, size = 24) => props => /*#__PURE__*/React.createElement("svg", {
    width: props?.size || size,
    height: props?.size || size,
    viewBox: "0 0 24 24",
    fill: props?.fill || "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: props?.style
  }, paths);
  const IcHome = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"
  })));
  const IcGrid = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "7",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "7",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "14",
    width: "7",
    height: "7",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "14",
    width: "7",
    height: "7",
    rx: "1.5"
  })));
  const IcLayers = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m12 2 9 5-9 5-9-5 9-5z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3 12 9 5 9-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3 17 9 5 9-5"
  })));
  const IcUser = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "8",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 21a8 8 0 0 1 16 0"
  })));
  const IcSun = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2M12 20v2M4 12H2M22 12h-2M6 6 4.5 4.5M19.5 19.5 18 18M18 6l1.5-1.5M4.5 19.5 6 18"
  })));
  const IcMap = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 3v15M15 6v15"
  })));
  const IcCamera = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "13",
    r: "3.5"
  })));
  const IcRupee = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 4h12M6 8h12M8 4c4.5 0 6.5 4 3 6-1.5.9-4 1-5 1l7 7"
  })));
  const IcChevron = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  })));
  const IcPlus = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })));
  const IcBell = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10.3 21a1.9 1.9 0 0 0 3.4 0"
  })));
  const IcSearch = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })));
  const IcX = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })));
  const IcSparkle = I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M18 18l-2.5-2.5M18 6l-2.5 2.5M6 18l2.5-2.5"
  })));

  /* ---- Shared shell chrome ---- */
  function StatusBar() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        fontSize: 15,
        fontWeight: 700,
        color: "var(--text-primary)"
      }
    }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        gap: 6,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "12",
      viewBox: "0 0 18 12",
      fill: "currentColor"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "0",
      y: "7",
      width: "3",
      height: "5",
      rx: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "5",
      y: "4",
      width: "3",
      height: "8",
      rx: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "10",
      y: "1",
      width: "3",
      height: "11",
      rx: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "14",
      y: "0",
      width: "3",
      height: "12",
      rx: "0.5",
      opacity: "0.35"
    })), /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "12",
      viewBox: "0 0 16 12",
      fill: "currentColor"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M8 2.5c2 0 3.8.8 5.2 2l1.3-1.4C13 1.3 10.6.5 8 .5S3 1.3 1.5 3.1L2.8 4.5C4.2 3.3 6 2.5 8 2.5z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M8 6c1 0 1.9.4 2.6 1l1.3-1.4C10.8 4.6 9.5 4 8 4s-2.8.6-3.9 1.6L5.4 7C6.1 6.4 7 6 8 6z"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "8",
      cy: "9.5",
      r: "1.8"
    })), /*#__PURE__*/React.createElement("svg", {
      width: "26",
      height: "12",
      viewBox: "0 0 26 12",
      fill: "none"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "0.5",
      y: "0.5",
      width: "21",
      height: "11",
      rx: "3",
      stroke: "currentColor",
      opacity: "0.4"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "2",
      y: "2",
      width: "18",
      height: "8",
      rx: "1.5",
      fill: "currentColor"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "23",
      y: "4",
      width: "2",
      height: "4",
      rx: "1",
      fill: "currentColor",
      opacity: "0.4"
    }))));
  }
  function TopBar({
    title
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 32,
        padding: "0 12px 0 8px",
        background: "var(--surface)",
        borderRadius: 999,
        boxShadow: "var(--e1)",
        fontSize: 13,
        fontWeight: 700
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "var(--glow-brand), var(--surface)",
        display: "grid",
        placeItems: "center",
        color: "var(--iris-violet)"
      }
    }, /*#__PURE__*/React.createElement(IcSparkle, {
      size: 13
    })), "\u20B912L"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-sans)",
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: "-0.03em",
        color: "var(--text-primary)"
      }
    }, title), /*#__PURE__*/React.createElement(Avatar, {
      name: "Amit Rao",
      size: 36
    }));
  }
  function BottomNav({
    tab,
    setTab
  }) {
    const items = [{
      k: "home",
      Ic: IcHome
    }, {
      k: "pipeline",
      Ic: IcGrid
    }];
    const right = [{
      k: "designs",
      Ic: IcLayers
    }, {
      k: "me",
      Ic: IcUser
    }];
    const NavBtn = ({
      k,
      Ic
    }) => {
      const active = tab === k;
      return /*#__PURE__*/React.createElement("button", {
        onClick: () => setTab(k),
        "aria-label": k,
        style: {
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: 8,
          color: active ? "var(--accent)" : "var(--text-tertiary)",
          display: "grid",
          placeItems: "center"
        }
      }, /*#__PURE__*/React.createElement(Ic, {
        size: 26,
        fill: active ? "var(--accent-subtle)" : "none"
      }));
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        height: 88,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        top: 0,
        background: "var(--surface)",
        borderRadius: "24px 24px 0 0",
        boxShadow: "var(--e4)",
        display: "flex",
        alignItems: "flex-start",
        paddingTop: 12,
        justifyContent: "space-around"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, items.map(i => /*#__PURE__*/React.createElement(NavBtn, _extends({
      key: i.k
    }, i)))), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 64
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, right.map(i => /*#__PURE__*/React.createElement(NavBtn, _extends({
      key: i.k
    }, i))))), /*#__PURE__*/React.createElement("button", {
      onClick: () => setTab("new"),
      "aria-label": "New quote",
      style: {
        position: "absolute",
        left: "50%",
        top: -8,
        transform: "translateX(-50%)",
        width: 60,
        height: 60,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        background: "var(--gradient-brand)",
        boxShadow: "var(--e5)",
        display: "grid",
        placeItems: "center",
        color: "#fff"
      }
    }, /*#__PURE__*/React.createElement(IcPlus, {
      size: 26
    })));
  }
  window.HGMobile = {
    NS,
    StatusBar,
    TopBar,
    BottomNav,
    Avatar,
    Card,
    IconCircle,
    StatCard,
    StatusChip,
    Chip,
    Badge,
    ListRow,
    Button,
    IconButton,
    Input,
    EmptyState,
    OfflineBanner,
    ProgressBar,
    Toast,
    SegmentedControl,
    icons: {
      IcHome,
      IcGrid,
      IcLayers,
      IcUser,
      IcSun,
      IcMap,
      IcCamera,
      IcRupee,
      IcChevron,
      IcPlus,
      IcBell,
      IcSearch,
      IcX,
      IcSparkle
    }
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/shell.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarGroup = __ds_scope.AvatarGroup;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconCircle = __ds_scope.IconCircle;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.StatusChip = __ds_scope.StatusChip;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.OfflineBanner = __ds_scope.OfflineBanner;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
