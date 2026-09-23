/* @ds-bundle: {"format":4,"namespace":"AVLEDesignSystem_11270f","components":[{"name":"BarChart","sourcePath":"components/charts/BarChart.jsx"},{"name":"Donut","sourcePath":"components/charts/Donut.jsx"},{"name":"Sparkline","sourcePath":"components/charts/Sparkline.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"EmptyState","sourcePath":"components/display/EmptyState.jsx"},{"name":"ListRow","sourcePath":"components/display/ListRow.jsx"},{"name":"Money","sourcePath":"components/display/Money.jsx"},{"name":"Delta","sourcePath":"components/display/Money.jsx"},{"name":"Progress","sourcePath":"components/display/Progress.jsx"},{"name":"Stat","sourcePath":"components/display/Stat.jsx"},{"name":"Table","sourcePath":"components/display/Table.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Insight","sourcePath":"components/feedback/Insight.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"ToastStack","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Tag","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Segmented","sourcePath":"components/forms/Segmented.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"Logo","sourcePath":"components/navigation/Logo.jsx"},{"name":"SideNav","sourcePath":"components/navigation/SideNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"TopNav","sourcePath":"components/navigation/TopNav.jsx"}],"sourceHashes":{"components/charts/BarChart.jsx":"e6d3f78931ea","components/charts/Donut.jsx":"0eb4765e3576","components/charts/Sparkline.jsx":"1a49512f5068","components/core/Avatar.jsx":"ceeb8913e68e","components/core/Badge.jsx":"180ef914f7da","components/core/Button.jsx":"26aaacb88031","components/core/Icon.jsx":"45db6212cea0","components/core/IconButton.jsx":"2d4c284b2097","components/core/Pill.jsx":"665b7feec427","components/display/Card.jsx":"8307421ca3db","components/display/EmptyState.jsx":"b6a88678a294","components/display/ListRow.jsx":"bcc2f2fe22d1","components/display/Money.jsx":"035f41fcd38a","components/display/Progress.jsx":"c6b63ed495a9","components/display/Stat.jsx":"6726ea22cf38","components/display/Table.jsx":"97ca853bd286","components/feedback/Dialog.jsx":"c10b3c160517","components/feedback/Insight.jsx":"f8a2072b5ba6","components/feedback/Toast.jsx":"e5edf353e051","components/feedback/Tooltip.jsx":"d5a53c9b0959","components/forms/Checkbox.jsx":"528d40a2803c","components/forms/Input.jsx":"4fe6240aeb09","components/forms/Radio.jsx":"532724806461","components/forms/Segmented.jsx":"2d7eac4a5522","components/forms/Select.jsx":"3271974987c9","components/forms/Switch.jsx":"ba9b01878439","components/navigation/BottomNav.jsx":"239bedbac958","components/navigation/Logo.jsx":"663da6df77c5","components/navigation/SideNav.jsx":"d142736d70bd","components/navigation/Tabs.jsx":"d255c62fc8ad","components/navigation/TopNav.jsx":"fa7852615eff","ui_kits/admin/AdminMore.jsx":"3026caae6b0d","ui_kits/admin/AdminOverview.jsx":"fb9112521e66","ui_kits/admin/AdminStores.jsx":"9c1a9dbe426e","ui_kits/cliente/CustomerHome.jsx":"047fd21eca94","ui_kits/cliente/CustomerMore.jsx":"28a3697c0af8","ui_kits/cliente/CustomerOrders.jsx":"13e053e3ccc9","ui_kits/loja/StoreFinance.jsx":"541f4e20cde2","ui_kits/loja/StoreOrders.jsx":"fb3f6c809cae","ui_kits/loja/StoreOverview.jsx":"b706f799954a","ui_kits/loja/StoreProducts.jsx":"7e4f6dc49c84","ui_kits/shared/AppShell.jsx":"5a687fea2046"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AVLEDesignSystem_11270f = window.AVLEDesignSystem_11270f || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/charts/BarChart.jsx
try { (() => {
function BarChart({
  data = [],
  height = 180,
  value,
  onChange,
  format = v => v
}) {
  const [sel, setSel] = React.useState(value ?? data.findIndex(d => d.highlight));
  const cur = value ?? sel;
  const max = Math.max(...data.map(d => d.value), 1);
  return /*#__PURE__*/React.createElement("div", {
    className: "av-bars",
    style: {
      height
    }
  }, data.map((d, i) => {
    const h = Math.max(8, d.value / max * (height - 56));
    const on = i === cur;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: 'av-bars__col' + (on ? ' av-bars__col--on' : ''),
      onClick: () => {
        setSel(i);
        onChange && onChange(i);
      }
    }, on && /*#__PURE__*/React.createElement("span", {
      className: "av-tip av-tip--accent av-bars__tip",
      style: {
        bottom: h + 34
      }
    }, format(d.value)), /*#__PURE__*/React.createElement("div", {
      className: "av-bars__bar",
      style: {
        height: h
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "av-bars__label"
    }, d.label));
  }));
}
Object.assign(__ds_scope, { BarChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/BarChart.jsx", error: String((e && e.message) || e) }); }

// components/charts/Donut.jsx
try { (() => {
function Donut({
  segments = [],
  size = 200,
  thickness = 22,
  center
}) {
  const r = (size - thickness) / 2,
    C = 2 * Math.PI * r,
    total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let off = 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("pattern", {
    id: "av-hatch",
    width: "6",
    height: "6",
    patternUnits: "userSpaceOnUse",
    patternTransform: "rotate(45)"
  }, /*#__PURE__*/React.createElement("rect", {
    width: "2",
    height: "6",
    fill: "var(--ink-600)"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--surface-raised)",
    strokeWidth: thickness
  }), segments.map((s, i) => {
    const len = s.value / total * C;
    const el = /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: size / 2,
      cy: size / 2,
      r: r,
      fill: "none",
      stroke: s.hatch ? 'url(#av-hatch)' : s.color,
      strokeWidth: thickness,
      strokeDasharray: `${Math.max(0, len - 4)} ${C}`,
      strokeDashoffset: -off,
      strokeLinecap: "round"
    });
    off += len;
    return el;
  })), center && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      textAlign: 'center'
    }
  }, center));
}
Object.assign(__ds_scope, { Donut });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/Donut.jsx", error: String((e && e.message) || e) }); }

// components/charts/Sparkline.jsx
try { (() => {
function Sparkline({
  data = [],
  width = 240,
  height = 80,
  color = 'var(--text-primary)',
  area = true,
  dot = true
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data),
    max = Math.max(...data),
    pad = 6;
  const pts = data.map((v, i) => [pad + i * (width - 2 * pad) / (data.length - 1), pad + (1 - (v - min) / (max - min || 1)) * (height - 2 * pad)]);
  let d = 'M' + pts[0].join(',');
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1],
      [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  const last = pts[pts.length - 1];
  const id = 'sp' + Math.random().toString(36).slice(2, 7);
  return /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: height,
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: "none",
    style: {
      display: 'block',
      overflow: 'visible'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: id,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "var(--accent)",
    stopOpacity: ".25"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "var(--accent)",
    stopOpacity: "0"
  }))), area && /*#__PURE__*/React.createElement("path", {
    d: d + ` L${last[0]},${height} L${pts[0][0]},${height} Z`,
    fill: `url(#${id})`
  }), /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: color,
    strokeWidth: "1.75",
    vectorEffect: "non-scaling-stroke"
  }), dot && /*#__PURE__*/React.createElement("circle", {
    cx: last[0],
    cy: last[1],
    r: "4",
    fill: "var(--accent)"
  }));
}
Object.assign(__ds_scope, { Sparkline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/Sparkline.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
function Avatar({
  src,
  name = '',
  size = 40,
  brand
}) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("span", {
    className: 'av-avatar' + (brand ? ' av-avatar--brand' : ''),
    style: {
      width: size,
      height: size,
      fontSize: Math.round(size * .36)
    },
    title: name
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Badge({
  tone = 'neutral',
  dot,
  children,
  className
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: cx('av-badge', 'av-badge--' + tone, className)
  }, dot && /*#__PURE__*/React.createElement("span", {
    className: "av-badge__dot"
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
const ICON_BASE = 'https://unpkg.com/lucide-static@0.460.0/icons/';
function Icon({
  name,
  size = 18,
  className,
  style,
  label
}) {
  return /*#__PURE__*/React.createElement("span", {
    role: label ? 'img' : undefined,
    "aria-label": label,
    "aria-hidden": label ? undefined : true,
    className: 'av-icon' + (className ? ' ' + className : ''),
    style: {
      width: size,
      height: size,
      '--av-icon': `url(${ICON_BASE}${name}.svg)`,
      ...style
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  block,
  children,
  className,
  ...rest
}) {
  const is = size === 'sm' ? 16 : 18;
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cx('av-btn', 'av-btn--' + variant, size !== 'md' && 'av-btn--' + size, block && 'av-btn--block', className)
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: is
  }), children, iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: is
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function IconButton({
  icon,
  variant = 'outline',
  size = 'md',
  dot,
  label,
  className,
  ...rest
}) {
  const is = size === 'sm' ? 15 : size === 'lg' ? 20 : 18;
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    title: label,
    className: cx('av-iconbtn', variant !== 'outline' && 'av-iconbtn--' + variant, size !== 'md' && 'av-iconbtn--' + size, className)
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: is
  }), dot && /*#__PURE__*/React.createElement("span", {
    className: "av-iconbtn__dot"
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Pill({
  active,
  accent,
  dot,
  icon,
  size = 'md',
  children,
  className,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cx('av-pill', active && 'av-pill--active', accent && 'av-pill--accent', size === 'sm' && 'av-pill--sm', className)
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "av-pill__dot"
  }), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'sm' ? 13 : 15
  }), children);
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Card({
  title,
  subtitle,
  actions,
  expand,
  onExpand,
  variant = 'default',
  flush,
  interactive,
  children,
  className,
  style,
  onClick
}) {
  const head = title || actions || expand;
  return /*#__PURE__*/React.createElement("section", {
    className: cx('av-card', variant !== 'default' && 'av-card--' + variant, flush && 'av-card--flush', interactive && 'av-card--interactive', className),
    style: style,
    onClick: onClick
  }, head && /*#__PURE__*/React.createElement("header", {
    className: "av-card__head"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    className: "av-card__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    className: "av-card__sub"
  }, subtitle)), (actions || expand) && /*#__PURE__*/React.createElement("div", {
    className: "av-card__actions"
  }, actions, expand && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "arrow-up-right",
    label: "Abrir",
    onClick: onExpand
  }))), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/EmptyState.jsx
try { (() => {
function EmptyState({
  icon = 'inbox',
  title,
  body,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "av-empty"
  }, /*#__PURE__*/React.createElement("span", {
    className: "av-empty__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 24
  })), title && /*#__PURE__*/React.createElement("div", {
    className: "av-empty__title"
  }, title), body && /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 320
    }
  }, body), action);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/display/ListRow.jsx
try { (() => {
function ListRow({
  icon,
  lead,
  title,
  subtitle,
  meta,
  trailing,
  trailingSub,
  trailingTone,
  onClick
}) {
  const col = trailingTone === 'positive' ? 'var(--positive)' : trailingTone === 'negative' ? 'var(--negative)' : undefined;
  return /*#__PURE__*/React.createElement("div", {
    className: 'av-row' + (onClick ? ' av-row--interactive' : ''),
    onClick: onClick
  }, lead || icon && /*#__PURE__*/React.createElement("span", {
    className: "av-row__lead"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "av-row__main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "av-row__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    className: "av-row__sub"
  }, subtitle)), meta && /*#__PURE__*/React.createElement("div", {
    className: "av-row__meta"
  }, meta), (trailing || trailingSub) && /*#__PURE__*/React.createElement("div", {
    className: "av-row__trail",
    style: {
      color: col
    }
  }, trailing, trailingSub && /*#__PURE__*/React.createElement("div", {
    className: "av-row__sub",
    style: {
      fontWeight: 400
    }
  }, trailingSub)));
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/display/Money.jsx
try { (() => {
function Money({
  value = 0,
  currency = 'R$',
  size = 32,
  decimals = 2,
  locale = 'pt-BR',
  style
}) {
  const s = Math.abs(value).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  const sep = 1.1.toLocaleString(locale).charAt(1);
  const [int, dec] = decimals ? [s.slice(0, s.lastIndexOf(sep)), s.slice(s.lastIndexOf(sep))] : [s, ''];
  return /*#__PURE__*/React.createElement("span", {
    className: "av-money",
    style: {
      fontSize: size,
      ...style
    }
  }, value < 0 && '−', currency && /*#__PURE__*/React.createElement("span", {
    className: "av-money__cur"
  }, currency), int, dec && /*#__PURE__*/React.createElement("span", {
    className: "av-money__dec"
  }, dec));
}
function Delta({
  value,
  suffix = '%',
  label
}) {
  const up = value >= 0;
  return /*#__PURE__*/React.createElement("span", {
    className: 'av-delta ' + (up ? 'av-delta--up' : 'av-delta--down')
  }, up ? '↗' : '↘', " ", Math.abs(value).toLocaleString('pt-BR'), suffix, label && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-tertiary)',
      fontWeight: 400,
      marginLeft: 4
    }
  }, label));
}
Object.assign(__ds_scope, { Money, Delta });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Money.jsx", error: String((e && e.message) || e) }); }

// components/display/Progress.jsx
try { (() => {
function Progress({
  value = 0,
  max = 100,
  knob,
  plain,
  size = 'md'
}) {
  const p = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", {
    className: 'av-progress' + (plain ? ' av-progress--plain' : '') + (size === 'sm' ? ' av-progress--sm' : ''),
    role: "progressbar",
    "aria-valuenow": Math.round(p),
    "aria-valuemin": 0,
    "aria-valuemax": 100
  }, /*#__PURE__*/React.createElement("div", {
    className: "av-progress__fill",
    style: {
      width: p + '%'
    }
  }), knob && size !== 'sm' && /*#__PURE__*/React.createElement("span", {
    className: "av-progress__knob",
    style: {
      left: `clamp(22px,${p}%,calc(100% - 22px))`
    }
  }, Math.round(p), "%"));
}
Object.assign(__ds_scope, { Progress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Progress.jsx", error: String((e && e.message) || e) }); }

// components/display/Stat.jsx
try { (() => {
function Stat({
  label,
  value,
  money = true,
  currency,
  size = 32,
  delta,
  deltaLabel,
  foot
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "av-stat"
  }, label && /*#__PURE__*/React.createElement("div", {
    className: "av-stat__label"
  }, label), money ? /*#__PURE__*/React.createElement(__ds_scope.Money, {
    value: value,
    currency: currency,
    size: size
  }) : /*#__PURE__*/React.createElement("span", {
    className: "av-money",
    style: {
      fontSize: size
    }
  }, typeof value === 'number' ? value.toLocaleString('pt-BR') : value), (delta != null || foot) && /*#__PURE__*/React.createElement("div", {
    className: "av-stat__foot"
  }, delta != null && /*#__PURE__*/React.createElement(__ds_scope.Delta, {
    value: delta,
    label: deltaLabel
  }), foot));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Stat.jsx", error: String((e && e.message) || e) }); }

// components/display/Table.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Table({
  columns = [],
  rows = [],
  onRowClick,
  stack = true,
  hover = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "av-table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: cx('av-table', stack && 'av-table--stack', hover && 'av-table--hover')
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    className: c.align === 'right' ? 'av-table__num' : undefined
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.id ?? i,
    onClick: onRowClick ? () => onRowClick(r) : undefined,
    style: onRowClick ? {
      cursor: 'pointer'
    } : undefined
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    className: c.align === 'right' ? 'av-table__num' : undefined,
    "data-hide-m": c.hideOnMobile ? '' : undefined
  }, c.render ? c.render(r) : r[c.key])))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Table.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open,
  title,
  description,
  children,
  footer,
  onClose
}) {
  React.useEffect(() => {
    if (!open) return;
    const k = e => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "av-scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "av-dialog",
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "av-dialog__head"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h2", {
    className: "av-dialog__title"
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "av-dialog__desc"
  }, description)), onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    size: "sm",
    label: "Fechar",
    onClick: onClose
  })), children, footer && /*#__PURE__*/React.createElement("div", {
    className: "av-dialog__foot"
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Insight.jsx
try { (() => {
function Insight({
  title,
  children,
  icon = 'sparkles',
  muted,
  onClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'av-insight' + (muted ? ' av-insight--muted' : ''),
    onClick: onClick,
    role: onClick ? 'button' : undefined
  }, /*#__PURE__*/React.createElement("span", {
    className: "av-insight__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "av-insight__title"
  }, title), children && /*#__PURE__*/React.createElement("div", {
    className: "av-insight__body"
  }, children)), onClick && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 18
  }));
}
Object.assign(__ds_scope, { Insight });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Insight.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function Toast({
  tone = 'positive',
  children,
  action,
  onAction
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "av-toast",
    role: "status"
  }, /*#__PURE__*/React.createElement("span", {
    className: 'av-toast__icon' + (tone === 'negative' ? ' av-toast__icon--negative' : '')
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: tone === 'negative' ? 'x' : 'check',
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    className: "av-toast__msg"
  }, children), action && /*#__PURE__*/React.createElement("button", {
    className: "av-btn av-btn--sm av-btn--ghost",
    style: {
      color: 'inherit'
    },
    onClick: onAction
  }, action));
}
function ToastStack({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "av-toast-stack"
  }, children);
}
Object.assign(__ds_scope, { Toast, ToastStack });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  content,
  children,
  accent
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "av-tipwrap",
    tabIndex: 0
  }, children, /*#__PURE__*/React.createElement("span", {
    className: "av-tipwrap__pop"
  }, /*#__PURE__*/React.createElement("span", {
    className: 'av-tip' + (accent ? ' av-tip--accent' : '')
  }, content)));
}
function Tag({
  children,
  accent
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: 'av-tip' + (accent ? ' av-tip--accent' : '')
  }, children);
}
Object.assign(__ds_scope, { Tooltip, Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  checked,
  onChange,
  disabled,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "av-check"
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: checked,
    onChange: e => onChange && onChange(e.target.checked),
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "av-check__box"
  }, checked && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14
  })), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Input({
  label,
  hint,
  error,
  icon,
  trailing,
  size = 'md',
  multiline,
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: cx('av-field', className),
    style: style
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "av-field__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: cx('av-input', size === 'sm' && 'av-input--sm', error && 'av-input--error', multiline && 'av-input--area')
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    className: "av-input__icon"
  }), multiline ? /*#__PURE__*/React.createElement("textarea", rest) : /*#__PURE__*/React.createElement("input", rest), trailing), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: cx('av-field__hint', error && 'av-field__hint--error')
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  label,
  checked,
  onChange,
  name,
  value,
  disabled
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "av-check"
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    onChange: () => onChange && onChange(value),
    disabled: disabled
  }), /*#__PURE__*/React.createElement("span", {
    className: "av-check__box av-check__box--radio"
  }, /*#__PURE__*/React.createElement("span", {
    className: "av-check__radiodot"
  })), label);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Segmented.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Segmented({
  options = [],
  value,
  onChange,
  size = 'md',
  block,
  className
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    className: cx('av-seg', size === 'sm' && 'av-seg--sm', block && 'av-seg--block', className)
  }, options.map(o => {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    const ic = typeof o === 'string' ? null : o.icon;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      "aria-selected": v === value,
      className: cx('av-seg__opt', v === value && 'av-seg__opt--on'),
      onClick: () => onChange && onChange(v)
    }, ic && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: ic,
      size: 14
    }), l);
  }));
}
Object.assign(__ds_scope, { Segmented });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Segmented.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
const cx = (...a) => a.filter(Boolean).join(' ');
function Select({
  label,
  hint,
  options = [],
  size = 'md',
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: cx('av-field', className),
    style: style
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "av-field__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: cx('av-input', size === 'sm' && 'av-input--sm')
  }, /*#__PURE__*/React.createElement("select", rest, options.map(o => typeof o === 'string' ? /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o) : /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16,
    className: "av-input__icon",
    style: {
      pointerEvents: 'none'
    }
  })), hint && /*#__PURE__*/React.createElement("span", {
    className: "av-field__hint"
  }, hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  label,
  checked,
  onChange,
  disabled
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "av-switch"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    role: "switch",
    checked: checked,
    onChange: e => onChange && onChange(e.target.checked),
    disabled: disabled
  }), /*#__PURE__*/React.createElement("span", {
    className: "av-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "av-switch__thumb"
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
function BottomNav({
  items = [],
  value,
  onChange,
  static: st
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: 'av-bottomnav' + (st ? ' av-bottomnav--static' : '')
  }, items.map(it => {
    const on = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      "aria-label": it.label,
      className: 'av-bottomnav__item' + (on ? ' av-bottomnav__item--on' : ''),
      onClick: () => onChange && onChange(it.value)
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 20
    }), on && /*#__PURE__*/React.createElement("span", null, it.label), it.badge && !on && /*#__PURE__*/React.createElement("span", {
      className: "av-bottomnav__badge"
    }));
  }));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Logo.jsx
try { (() => {
function Logo({
  variant = 'wordmark',
  tone = 'auto',
  height = 26,
  base = ''
}) {
  const t = tone === 'auto' ? document.documentElement.getAttribute('data-theme') === 'light' ? 'forest' : 'cream' : tone;
  const file = variant === 'tree' ? 'avle-tree-' : variant === 'full' ? 'avle-logo-' : 'avle-wordmark-';
  return /*#__PURE__*/React.createElement("img", {
    src: `${base}assets/${file}${t}.png`,
    alt: "AVLE",
    style: {
      height,
      display: 'block'
    }
  });
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Logo.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SideNav.jsx
try { (() => {
function SideNav({
  groups = [],
  value,
  onChange,
  header,
  footer,
  style
}) {
  return /*#__PURE__*/React.createElement("aside", {
    className: "av-sidenav",
    style: style
  }, header, groups.map((g, gi) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: gi
  }, g.label && /*#__PURE__*/React.createElement("div", {
    className: "av-sidenav__group"
  }, g.label), g.items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.value,
    className: 'av-sidenav__item' + (it.value === value ? ' av-sidenav__item--on' : ''),
    onClick: () => onChange && onChange(it.value)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 18
  }), it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
    className: "av-sidenav__count"
  }, it.count))))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), footer);
}
Object.assign(__ds_scope, { SideNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SideNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "av-tabs",
    role: "tablist"
  }, items.map(it => {
    const v = typeof it === 'string' ? it : it.value;
    const l = typeof it === 'string' ? it : it.label;
    const c = typeof it === 'string' ? null : it.count;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      "aria-selected": v === value,
      className: 'av-tab' + (v === value ? ' av-tab--on' : ''),
      onClick: () => onChange && onChange(v)
    }, l, c != null && /*#__PURE__*/React.createElement("span", {
      className: "av-tab__count"
    }, c));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopNav.jsx
try { (() => {
function TopNav({
  items = [],
  value,
  onChange,
  role,
  end,
  base = '',
  onBrand
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "av-topnav"
  }, /*#__PURE__*/React.createElement("div", {
    className: "av-topnav__brand",
    onClick: onBrand
  }, /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    base: base,
    height: 22
  }), role && /*#__PURE__*/React.createElement("span", {
    className: "av-topnav__role"
  }, role)), items.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "av-topnav__links"
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.value,
    className: 'av-topnav__link' + (it.value === value ? ' av-topnav__link--on' : ''),
    onClick: () => onChange && onChange(it.value)
  }, it.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 15
  }), it.label))), /*#__PURE__*/React.createElement("div", {
    className: "av-topnav__spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "av-topnav__end"
  }, end));
}
Object.assign(__ds_scope, { TopNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopNav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminMore.jsx
try { (() => {
(() => {
  const {
    Card,
    Table,
    Tabs,
    Input,
    Badge,
    Avatar,
    Money,
    Button,
    Pill,
    IconButton,
    ListRow,
    Insight
  } = window.AVLEDesignSystem_11270f;
  const USERS = [{
    n: 'Lucas Andrade',
    e: 'lucas@email.com',
    t: 'Cliente',
    o: 14,
    v: 2140.8,
    d: '12.03.24',
    s: 'Ativo'
  }, {
    n: 'Marina Costa',
    e: 'marina@raizcasa.com',
    t: 'Lojista',
    o: 0,
    v: 0,
    d: '02.01.24',
    s: 'Ativo'
  }, {
    n: 'Beatriz Nunes',
    e: 'bia.nunes@email.com',
    t: 'Cliente',
    o: 3,
    v: 318.4,
    d: '19.07.26',
    s: 'Ativo'
  }, {
    n: 'Sérgio Lima',
    e: 'sergio@bazarnorte.com',
    t: 'Lojista',
    o: 0,
    v: 0,
    d: '11.05.25',
    s: 'Bloqueado'
  }, {
    n: 'Carla Menezes',
    e: 'carla.m@email.com',
    t: 'Cliente',
    o: 27,
    v: 5820,
    d: '08.11.23',
    s: 'Ativo'
  }];
  function AdminUsers() {
    const [tab, setTab] = React.useState('all');
    const list = USERS.filter(u => tab === 'all' || u.t === tab);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Usu\xE1rios",
      sub: "49.494 contas \xB7 1.284 lojistas"
    }), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: setTab,
      items: [{
        value: 'all',
        label: 'Todos'
      }, {
        value: 'Cliente',
        label: 'Clientes'
      }, {
        value: 'Lojista',
        label: 'Lojistas'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '1 1 240px',
        maxWidth: 340
      }
    }, /*#__PURE__*/React.createElement(Input, {
      size: "sm",
      icon: "search",
      placeholder: "Nome, e-mail ou CPF"
    }))), /*#__PURE__*/React.createElement(Table, {
      rows: list,
      columns: [{
        key: 'n',
        label: 'Usuário',
        render: u => /*#__PURE__*/React.createElement("div", {
          className: "kit-row"
        }, /*#__PURE__*/React.createElement(Avatar, {
          name: u.n,
          size: 34
        }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
          style: {
            fontWeight: 600
          }
        }, u.n), /*#__PURE__*/React.createElement("div", {
          className: "kit-muted"
        }, u.e)))
      }, {
        key: 't',
        label: 'Tipo',
        hideOnMobile: true,
        render: u => /*#__PURE__*/React.createElement(Badge, {
          tone: u.t === 'Lojista' ? 'info' : 'neutral'
        }, u.t)
      }, {
        key: 'o',
        label: 'Pedidos',
        hideOnMobile: true
      }, {
        key: 'v',
        label: 'Gasto total',
        hideOnMobile: true,
        align: 'right',
        render: u => u.v ? /*#__PURE__*/React.createElement(Money, {
          value: u.v,
          size: 14
        }) : /*#__PURE__*/React.createElement("span", {
          className: "kit-muted"
        }, "\u2014")
      }, {
        key: 'd',
        label: 'Desde',
        hideOnMobile: true,
        render: u => /*#__PURE__*/React.createElement("span", {
          style: {
            color: 'var(--text-secondary)'
          }
        }, u.d)
      }, {
        key: 's',
        label: 'Status',
        align: 'right',
        render: u => /*#__PURE__*/React.createElement(Badge, {
          tone: u.s === 'Ativo' ? 'positive' : 'negative',
          dot: true
        }, u.s)
      }]
    })));
  }
  const CASES = [{
    id: 'D-318',
    t: 'Produto não recebido',
    who: 'Beatriz Nunes → Bazar Norte',
    v: 96.5,
    age: '2d',
    pr: 'negative'
  }, {
    id: 'D-317',
    t: 'Item diferente do anunciado',
    who: 'Carla Menezes → Casa Oliva',
    v: 129.9,
    age: '1d',
    pr: 'warning'
  }, {
    id: 'D-315',
    t: 'Produto denunciado: réplica',
    who: 'Denúncia anônima → Bazar Norte',
    v: 0,
    age: '5h',
    pr: 'warning'
  }];
  function AdminDisputes({
    toast
  }) {
    const [items, setItems] = React.useState(CASES);
    const resolve = (id, how) => {
      setItems(xs => xs.filter(x => x.id !== id));
      toast(id + ' · ' + how);
    };
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Disputas & modera\xE7\xE3o",
      sub: items.length + ' casos abertos'
    }), /*#__PURE__*/React.createElement("div", {
      className: "g"
    }, /*#__PURE__*/React.createElement("div", {
      className: "s8",
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, items.length === 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
      className: "av-empty"
    }, /*#__PURE__*/React.createElement("div", {
      className: "av-empty__title"
    }, "Tudo resolvido"), "Nenhum caso aberto no momento.")), items.map(c => /*#__PURE__*/React.createElement(Card, {
      key: c.id,
      style: {
        padding: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: c.pr,
      dot: true
    }, c.id), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, c.t)), /*#__PURE__*/React.createElement("span", {
      className: "kit-muted"
    }, "aberto h\xE1 ", c.age)), /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)'
      }
    }, c.who), c.v > 0 && /*#__PURE__*/React.createElement(Money, {
      value: c.v,
      size: 16
    })), /*#__PURE__*/React.createElement("div", {
      className: "kit-row"
    }, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => resolve(c.id, 'reembolso aprovado')
    }, "Reembolsar cliente"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      onClick: () => resolve(c.id, 'a favor da loja')
    }, "A favor da loja"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost"
    }, "Ver conversa"))))), /*#__PURE__*/React.createElement("div", {
      className: "s4",
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      title: "Esta semana"
    }, /*#__PURE__*/React.createElement(ListRow, {
      icon: "scale",
      title: "Casos resolvidos",
      trailing: "42"
    }), /*#__PURE__*/React.createElement(ListRow, {
      icon: "timer",
      title: "Tempo m\xE9dio",
      trailing: "31h"
    }), /*#__PURE__*/React.createElement(ListRow, {
      icon: "rotate-ccw",
      title: "Reembolsos",
      trailing: brl(4820.3),
      trailingTone: "negative"
    })), /*#__PURE__*/React.createElement(Insight, {
      title: "Bazar Norte em 2 casos",
      onClick: () => toast('Loja enviada para revisão')
    }, "Considere revisar a loja"))));
  }
  Object.assign(window, {
    AdminUsers,
    AdminDisputes
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminMore.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminOverview.jsx
try { (() => {
(() => {
  const {
    Card,
    Stat,
    Money,
    Delta,
    BarChart,
    Donut,
    ListRow,
    Avatar,
    Badge,
    Button,
    Insight,
    Segmented,
    IconButton,
    Sparkline,
    Progress
  } = window.AVLEDesignSystem_11270f;
  const MONTHS = [['Abr', 1.42], ['Mai', 1.58], ['Jun', 1.51], ['Jul', 1.86], ['Ago', 2.04], ['Set', 2.31]].map(([label, v], i) => ({
    label,
    value: v * 1e6,
    highlight: i === 5
  }));
  const PENDING = [['Verde Casa', 'Plantas · SP', '2h'], ['Ateliê Barro', 'Cerâmica · MG', '5h'], ['Fio & Trama', 'Têxtil · RS', '1d'], ['Luz Nativa', 'Iluminação · BA', '1d']];
  function AdminOverview({
    go,
    toast
  }) {
    const [p, setP] = React.useState('6m');
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Vis\xE3o geral",
      sub: "Marketplace AVLE \xB7 setembro 2026"
    }, /*#__PURE__*/React.createElement(Segmented, {
      options: [{
        value: '30d',
        label: '30 dias'
      }, {
        value: '6m',
        label: '6 meses'
      }, {
        value: '12m',
        label: '12 meses'
      }],
      value: p,
      onChange: setP
    }), /*#__PURE__*/React.createElement("span", {
      className: "kit-desktop-only"
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "download",
      label: "Exportar"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "g"
    }, [['GMV', 2310480, 13.2, true], ['Receita AVLE', 184838.4, 11.8, true], ['Lojas ativas', 1284, 4.1, false], ['Clientes ativos', 48210, 7.6, false]].map(([l, v, d, m]) => /*#__PURE__*/React.createElement(Card, {
      key: l,
      className: "s3 m-half"
    }, /*#__PURE__*/React.createElement(Stat, {
      label: l,
      value: v,
      money: m,
      size: 28,
      delta: d,
      deltaLabel: "m\xEAs"
    }))), /*#__PURE__*/React.createElement(Card, {
      className: "s8",
      title: "GMV mensal",
      expand: true,
      actions: /*#__PURE__*/React.createElement(Badge, {
        tone: "positive",
        dot: true
      }, "Recorde")
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        alignItems: 'baseline',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Money, {
      value: 2310480,
      size: 28,
      decimals: 0
    }), /*#__PURE__*/React.createElement(Delta, {
      value: 13.2,
      label: "vs agosto"
    })), /*#__PURE__*/React.createElement(BarChart, {
      data: MONTHS,
      height: 230,
      format: v => 'R$ ' + (v / 1e6).toLocaleString('pt-BR', {
        maximumFractionDigits: 2
      }) + ' mi'
    })), /*#__PURE__*/React.createElement(Card, {
      className: "s4",
      title: "Aprova\xE7\xF5es pendentes",
      subtitle: "Tempo m\xE9dio de an\xE1lise: 9h",
      expand: true,
      onExpand: () => go('lojas')
    }, /*#__PURE__*/React.createElement("div", null, PENDING.map(([n, s, t]) => /*#__PURE__*/React.createElement(ListRow, {
      key: n,
      lead: /*#__PURE__*/React.createElement(Avatar, {
        name: n,
        brand: true
      }),
      title: n,
      subtitle: s,
      meta: t,
      onClick: () => go('lojas')
    }))), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      block: true,
      iconRight: "arrow-right",
      onClick: () => go('lojas')
    }, "Analisar 4 lojas")), /*#__PURE__*/React.createElement(Card, {
      className: "s4",
      title: "Categorias"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        gap: 18,
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Donut, {
      size: 150,
      thickness: 18,
      segments: [{
        value: 38,
        color: 'var(--chart-1)'
      }, {
        value: 27,
        color: 'var(--chart-2)'
      }, {
        value: 20,
        color: 'var(--chart-4)'
      }, {
        value: 15,
        hatch: true
      }],
      center: /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: "av-money",
        style: {
          fontSize: 20
        }
      }, "38%"), /*#__PURE__*/React.createElement("div", {
        className: "kit-muted"
      }, "Decora\xE7\xE3o"))
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontSize: 13
      }
    }, [['var(--chart-1)', 'Decoração', '38%'], ['var(--chart-2)', 'Têxtil', '27%'], ['var(--chart-4)', 'Mesa posta', '20%'], ['var(--ink-600)', 'Outros', '15%']].map(([c, k, v]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      className: "kit-row",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 9,
        background: c
      }
    }), k, /*#__PURE__*/React.createElement("b", {
      style: {
        marginLeft: 'auto',
        fontWeight: 600
      }
    }, v)))))), /*#__PURE__*/React.createElement(Card, {
      className: "s4",
      title: "Sa\xFAde da plataforma"
    }, [['Pedidos entregues no prazo', 94], ['Disputas resolvidas em 48h', 81], ['Uptime de pagamentos', 99.9]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between',
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)'
      }
    }, k), /*#__PURE__*/React.createElement("b", {
      style: {
        fontWeight: 600
      }
    }, v.toLocaleString('pt-BR'), "%")), /*#__PURE__*/React.createElement(Progress, {
      value: v,
      size: "sm",
      plain: true
    })))), /*#__PURE__*/React.createElement(Card, {
      className: "s4",
      title: "Alertas"
    }, /*#__PURE__*/React.createElement(Insight, {
      title: "Pico de chargebacks",
      onClick: () => go('disputas')
    }, "3 lojas acima de 1,5% esta semana"), /*#__PURE__*/React.createElement(Insight, {
      muted: true,
      icon: "shield-alert",
      title: "7 produtos denunciados",
      onClick: () => go('disputas')
    }, "Aguardando modera\xE7\xE3o"))));
  }
  window.AdminOverview = AdminOverview;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminOverview.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminStores.jsx
try { (() => {
(() => {
  const {
    Card,
    Table,
    Tabs,
    Input,
    Badge,
    Avatar,
    Money,
    Button,
    Dialog,
    IconButton,
    Checkbox,
    Select,
    ListRow
  } = window.AVLEDesignSystem_11270f;
  const TONE = {
    Ativa: 'positive',
    Pendente: 'warning',
    Suspensa: 'negative'
  };
  const STORES = [{
    id: 1,
    n: 'Verde Casa',
    o: 'Paula Martins',
    c: 'Plantas',
    city: 'São Paulo, SP',
    gmv: 0,
    s: 'Pendente',
    r: '—'
  }, {
    id: 2,
    n: 'Ateliê Barro',
    o: 'Tiago Rocha',
    c: 'Cerâmica',
    city: 'Belo Horizonte, MG',
    gmv: 0,
    s: 'Pendente',
    r: '—'
  }, {
    id: 3,
    n: 'Raiz Casa & Decoração',
    o: 'Marina Costa',
    c: 'Decoração',
    city: 'São Paulo, SP',
    gmv: 184320,
    s: 'Ativa',
    r: '4,8'
  }, {
    id: 4,
    n: 'Fio & Trama',
    o: 'Renata Dias',
    c: 'Têxtil',
    city: 'Porto Alegre, RS',
    gmv: 0,
    s: 'Pendente',
    r: '—'
  }, {
    id: 5,
    n: 'Casa Oliva',
    o: 'André Lopes',
    c: 'Mesa posta',
    city: 'Curitiba, PR',
    gmv: 96410.5,
    s: 'Ativa',
    r: '4,6'
  }, {
    id: 6,
    n: 'Bazar Norte',
    o: 'Sérgio Lima',
    c: 'Variedades',
    city: 'Recife, PE',
    gmv: 12480,
    s: 'Suspensa',
    r: '3,1'
  }];
  function AdminStores({
    toast
  }) {
    const [rows, setRows] = React.useState(STORES);
    const [tab, setTab] = React.useState('Pendente');
    const [open, setOpen] = React.useState(null);
    const [refuse, setRefuse] = React.useState(false);
    const c = s => rows.filter(r => r.s === s).length;
    const list = rows.filter(r => tab === 'all' || r.s === tab);
    const setStatus = (id, s, msg) => {
      setRows(rs => rs.map(r => r.id === id ? {
        ...r,
        s
      } : r));
      setOpen(null);
      setRefuse(false);
      toast(msg, s === 'Suspensa' ? 'negative' : 'positive');
    };
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Lojas",
      sub: rows.length + ' lojas cadastradas'
    }, /*#__PURE__*/React.createElement("span", {
      className: "kit-desktop-only"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      icon: "download"
    }, "Exportar"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: setTab,
      items: [{
        value: 'Pendente',
        label: 'Pendentes',
        count: c('Pendente')
      }, {
        value: 'Ativa',
        label: 'Ativas',
        count: c('Ativa')
      }, {
        value: 'Suspensa',
        label: 'Suspensas',
        count: c('Suspensa')
      }, {
        value: 'all',
        label: 'Todas'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '1 1 240px',
        maxWidth: 340
      }
    }, /*#__PURE__*/React.createElement(Input, {
      size: "sm",
      icon: "search",
      placeholder: "Buscar loja, CNPJ ou respons\xE1vel"
    }))), /*#__PURE__*/React.createElement(Table, {
      onRowClick: setOpen,
      rows: list,
      columns: [{
        key: 'n',
        label: 'Loja',
        render: r => /*#__PURE__*/React.createElement("div", {
          className: "kit-row"
        }, /*#__PURE__*/React.createElement(Avatar, {
          name: r.n,
          brand: true,
          size: 34
        }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
          style: {
            fontWeight: 600
          }
        }, r.n), /*#__PURE__*/React.createElement("div", {
          className: "kit-muted"
        }, r.o)))
      }, {
        key: 'c',
        label: 'Categoria',
        hideOnMobile: true
      }, {
        key: 'city',
        label: 'Cidade',
        hideOnMobile: true,
        render: r => /*#__PURE__*/React.createElement("span", {
          style: {
            color: 'var(--text-secondary)'
          }
        }, r.city)
      }, {
        key: 'r',
        label: 'Nota',
        hideOnMobile: true
      }, {
        key: 'gmv',
        label: 'GMV 30d',
        align: 'right',
        hideOnMobile: true,
        render: r => r.gmv ? /*#__PURE__*/React.createElement(Money, {
          value: r.gmv,
          size: 14
        }) : /*#__PURE__*/React.createElement("span", {
          className: "kit-muted"
        }, "\u2014")
      }, {
        key: 's',
        label: 'Status',
        align: 'right',
        render: r => /*#__PURE__*/React.createElement(Badge, {
          tone: TONE[r.s],
          dot: true
        }, r.s)
      }]
    })), /*#__PURE__*/React.createElement(Dialog, {
      open: !!open && !refuse,
      onClose: () => setOpen(null),
      title: open && open.n,
      description: open && open.c + ' · ' + open.city,
      footer: open && (open.s === 'Pendente' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "danger",
        onClick: () => setRefuse(true)
      }, "Recusar"), /*#__PURE__*/React.createElement(Button, {
        icon: "check",
        onClick: () => setStatus(open.id, 'Ativa', open.n + ' aprovada')
      }, "Aprovar loja")) : open.s === 'Ativa' ? /*#__PURE__*/React.createElement(Button, {
        variant: "danger",
        onClick: () => setStatus(open.id, 'Suspensa', open.n + ' suspensa')
      }, "Suspender") : /*#__PURE__*/React.createElement(Button, {
        onClick: () => setStatus(open.id, 'Ativa', open.n + ' reativada')
      }, "Reativar"))
    }, open && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(ListRow, {
      icon: "user",
      title: "Respons\xE1vel",
      trailing: open.o
    }), /*#__PURE__*/React.createElement(ListRow, {
      icon: "file-text",
      title: "CNPJ",
      trailing: "12.345.678/0001-90"
    }), /*#__PURE__*/React.createElement(ListRow, {
      icon: "landmark",
      title: "Conta banc\xE1ria",
      trailing: /*#__PURE__*/React.createElement(Badge, {
        tone: "positive"
      }, "Verificada")
    }), /*#__PURE__*/React.createElement(ListRow, {
      icon: "id-card",
      title: "Documentos",
      trailing: /*#__PURE__*/React.createElement(Badge, {
        tone: open.s === 'Pendente' ? 'warning' : 'positive'
      }, open.s === 'Pendente' ? '2 de 3' : 'Completos')
    }))), /*#__PURE__*/React.createElement(Dialog, {
      open: refuse,
      onClose: () => setRefuse(false),
      title: "Recusar cadastro?",
      description: "O lojista receber\xE1 o motivo por e-mail e poder\xE1 reenviar.",
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        onClick: () => setRefuse(false)
      }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
        variant: "danger",
        onClick: () => setStatus(open.id, 'Suspensa', 'Cadastro recusado')
      }, "Recusar"))
    }, /*#__PURE__*/React.createElement(Select, {
      label: "Motivo",
      options: ['Documentos ilegíveis', 'CNPJ inativo', 'Categoria não permitida', 'Outro']
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Mensagem ao lojista",
      multiline: true,
      placeholder: "Opcional"
    })));
  }
  window.AdminStores = AdminStores;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminStores.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cliente/CustomerHome.jsx
try { (() => {
(() => {
  const {
    Card,
    Money,
    ListRow,
    Avatar,
    Badge,
    Button,
    Icon,
    IconButton,
    Insight,
    Pill
  } = window.AVLEDesignSystem_11270f;
  const STEPS = [['check', 'Confirmado'], ['package', 'Separado'], ['truck', 'Em trânsito'], ['house', 'Entregue']];
  function Steps({
    at
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "kit-steps"
    }, STEPS.map(([ic, l], i) => /*#__PURE__*/React.createElement("div", {
      key: l,
      className: 'kit-step' + (i <= at ? ' kit-step--done' : '')
    }, /*#__PURE__*/React.createElement("span", {
      className: "kit-step__dot"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 14
    })), l)));
  }
  window.OrderSteps = Steps;
  const FAVS = [{
    n: 'Vaso Terra',
    s: 'Raiz Casa',
    v: 189.9,
    ic: 'flower-2'
  }, {
    n: 'Manta de linho',
    s: 'Raiz Casa',
    v: 249,
    ic: 'layers'
  }, {
    n: 'Caneca Musgo',
    s: 'Ateliê Barro',
    v: 64.9,
    ic: 'coffee'
  }];
  function CustomerHome({
    go,
    toast
  }) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Ol\xE1, Lucas",
      sub: "Voc\xEA tem 1 pedido a caminho"
    }, /*#__PURE__*/React.createElement("span", {
      className: "kit-desktop-only"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      icon: "headphones"
    }, "Ajuda"))), /*#__PURE__*/React.createElement("div", {
      className: "g"
    }, /*#__PURE__*/React.createElement(Card, {
      className: "s8",
      title: "Pedido a caminho",
      subtitle: "#AV-2038 \xB7 Raiz Casa & Decora\xE7\xE3o",
      expand: true,
      onExpand: () => go('pedidos')
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        gap: 16,
        alignItems: 'stretch'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-ph",
      style: {
        width: 120,
        aspectRatio: '1',
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "lamp",
      size: 32
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "info",
      dot: true
    }, "Em tr\xE2nsito"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22
      }
    }, "Chega ", /*#__PURE__*/React.createElement("b", {
      style: {
        fontWeight: 600
      }
    }, "quinta, 30 set")), /*#__PURE__*/React.createElement("div", {
      className: "kit-muted"
    }, "Lumin\xE1ria de bambu + 2 itens \xB7 Correios Sedex"))), /*#__PURE__*/React.createElement(Steps, {
      at: 2
    }), /*#__PURE__*/React.createElement("div", {
      className: "kit-row"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: "map-pin",
      onClick: () => toast('Link de rastreio copiado')
    }, "Rastrear"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost"
    }, "Falar com a loja"))), /*#__PURE__*/React.createElement(Card, {
      className: "s4",
      title: "Saldo AVLE"
    }, /*#__PURE__*/React.createElement(Money, {
      value: 42.5,
      size: 40
    }), /*#__PURE__*/React.createElement("div", {
      className: "kit-muted"
    }, "Cashback dispon\xEDvel para a pr\xF3xima compra"), /*#__PURE__*/React.createElement(Insight, {
      title: "Ganhe R$ 15 de volta",
      onClick: () => toast('Cupom ativado')
    }, "Em compras acima de R$ 150 at\xE9 domingo")), /*#__PURE__*/React.createElement(Card, {
      className: "s6",
      title: "\xDAltimos pedidos",
      expand: true,
      onExpand: () => go('pedidos')
    }, /*#__PURE__*/React.createElement("div", null, [['#AV-2038', 'Raiz Casa', '27.09', 412.3, 'Em trânsito', 'info'], ['#AV-1987', 'Ateliê Barro', '12.09', 129.8, 'Entregue', 'positive'], ['#AV-1920', 'Verde Casa', '30.08', 89.9, 'Entregue', 'positive']].map(([id, s, d, v, st, t]) => /*#__PURE__*/React.createElement(ListRow, {
      key: id,
      lead: /*#__PURE__*/React.createElement(Avatar, {
        name: s,
        brand: true
      }),
      title: s,
      subtitle: id + ' · ' + d,
      trailing: brl(v),
      trailingSub: /*#__PURE__*/React.createElement(Badge, {
        tone: t
      }, st),
      onClick: () => go('pedidos')
    })))), /*#__PURE__*/React.createElement(Card, {
      className: "s6",
      title: "Favoritos",
      expand: true,
      onExpand: () => go('favoritos')
    }, /*#__PURE__*/React.createElement("div", {
      className: "g",
      style: {
        gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
        gap: 12
      }
    }, FAVS.map(f => /*#__PURE__*/React.createElement("div", {
      key: f.n,
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer'
      },
      onClick: () => go('favoritos')
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-ph",
      style: {
        aspectRatio: '1'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: f.ic,
      size: 28
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, f.n), /*#__PURE__*/React.createElement(Money, {
      value: f.v,
      size: 14
    }))))), /*#__PURE__*/React.createElement(Card, {
      className: "s12",
      title: "Continue explorando"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row"
    }, ['Decoração', 'Mesa posta', 'Iluminação', 'Têxtil', 'Plantas', 'Presentes'].map((c, i) => /*#__PURE__*/React.createElement(Pill, {
      key: c,
      active: i === 0
    }, c))))));
  }
  window.CustomerHome = CustomerHome;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cliente/CustomerHome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cliente/CustomerMore.jsx
try { (() => {
(() => {
  const {
    Card,
    Money,
    Icon,
    IconButton,
    Button,
    Input,
    Switch,
    Avatar,
    ListRow,
    Radio,
    Pill,
    EmptyState
  } = window.AVLEDesignSystem_11270f;
  const FAVS = [{
    id: 1,
    n: 'Vaso de cerâmica Terra',
    s: 'Raiz Casa',
    v: 189.9,
    ic: 'flower-2'
  }, {
    id: 2,
    n: 'Manta de linho natural',
    s: 'Raiz Casa',
    v: 249,
    ic: 'layers'
  }, {
    id: 3,
    n: 'Caneca Musgo',
    s: 'Ateliê Barro',
    v: 64.9,
    ic: 'coffee'
  }, {
    id: 4,
    n: 'Cachepô de fibra',
    s: 'Verde Casa',
    v: 89.9,
    ic: 'sprout'
  }, {
    id: 5,
    n: 'Quadro Folhagem',
    s: 'Raiz Casa',
    v: 320,
    ic: 'image'
  }, {
    id: 6,
    n: 'Luminária de bambu',
    s: 'Raiz Casa',
    v: 239,
    ic: 'lamp'
  }];
  function CustomerFavorites({
    toast
  }) {
    const [items, setItems] = React.useState(FAVS);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Favoritos",
      sub: items.length + ' produtos salvos'
    }), items.length === 0 ? /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
      icon: "heart",
      title: "Nenhum favorito ainda",
      body: "Toque no cora\xE7\xE3o de um produto para salv\xE1-lo aqui."
    })) : /*#__PURE__*/React.createElement("div", {
      className: "g"
    }, items.map(f => /*#__PURE__*/React.createElement(Card, {
      key: f.id,
      className: "s3 m-half",
      style: {
        padding: 12,
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-ph",
      style: {
        aspectRatio: '1'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: f.ic,
      size: 36
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "heart",
      variant: "accent",
      size: "sm",
      label: "Remover dos favoritos",
      onClick: () => {
        setItems(xs => xs.filter(x => x.id !== f.id));
        toast('Removido dos favoritos');
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 4px 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-muted"
    }, f.s), /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, f.n), /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Money, {
      value: f.v,
      size: 18
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "shopping-bag",
      size: "sm",
      label: "Adicionar \xE0 sacola",
      onClick: () => toast('Adicionado à sacola')
    })))))));
  }
  function CustomerAccount({
    toast
  }) {
    const [n, setN] = React.useState({
      pedidos: true,
      ofertas: false,
      whatsapp: true
    });
    const [addr, setAddr] = React.useState('casa');
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Minha conta",
      sub: "Dados, endere\xE7os e prefer\xEAncias"
    }), /*#__PURE__*/React.createElement("div", {
      className: "g"
    }, /*#__PURE__*/React.createElement(Card, {
      className: "s7",
      title: "Dados pessoais"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Lucas Andrade",
      size: 64
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18
      }
    }, "Lucas Andrade"), /*#__PURE__*/React.createElement("div", {
      className: "kit-muted"
    }, "Cliente desde 2024"))), /*#__PURE__*/React.createElement("div", {
      className: "g",
      style: {
        gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Nome completo",
      defaultValue: "Lucas Andrade"
    }), /*#__PURE__*/React.createElement(Input, {
      label: "CPF",
      defaultValue: "\u2022\u2022\u2022.482.910-\u2022\u2022",
      disabled: true
    }), /*#__PURE__*/React.createElement(Input, {
      label: "E-mail",
      icon: "mail",
      defaultValue: "lucas@email.com"
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Celular",
      icon: "phone",
      defaultValue: "(11) 98765-4321"
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, {
      onClick: () => toast('Dados atualizados')
    }, "Salvar altera\xE7\xF5es"))), /*#__PURE__*/React.createElement("div", {
      className: "s5",
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      title: "Endere\xE7os",
      actions: /*#__PURE__*/React.createElement(IconButton, {
        icon: "plus",
        label: "Novo endere\xE7o"
      })
    }, [['casa', 'Casa', 'Rua das Palmeiras, 120 · São Paulo, SP'], ['trab', 'Trabalho', 'Av. Paulista, 1500, cj 82 · São Paulo, SP']].map(([v, t, s]) => /*#__PURE__*/React.createElement("div", {
      key: v,
      style: {
        padding: 14,
        borderRadius: 18,
        background: addr === v ? 'var(--surface-raised)' : 'transparent',
        border: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement(Radio, {
      name: "addr",
      value: v,
      checked: addr === v,
      onChange: setAddr,
      label: /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 500
        }
      }, t), /*#__PURE__*/React.createElement("div", {
        className: "kit-muted"
      }, s))
    })))), /*#__PURE__*/React.createElement(Card, {
      title: "Notifica\xE7\xF5es"
    }, /*#__PURE__*/React.createElement(Switch, {
      label: "Status dos pedidos",
      checked: n.pedidos,
      onChange: v => setN({
        ...n,
        pedidos: v
      })
    }), /*#__PURE__*/React.createElement(Switch, {
      label: "Ofertas e cupons",
      checked: n.ofertas,
      onChange: v => setN({
        ...n,
        ofertas: v
      })
    }), /*#__PURE__*/React.createElement(Switch, {
      label: "Avisos por WhatsApp",
      checked: n.whatsapp,
      onChange: v => setN({
        ...n,
        whatsapp: v
      })
    })), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      icon: "log-out"
    }, "Sair da conta"))));
  }
  Object.assign(window, {
    CustomerFavorites,
    CustomerAccount
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cliente/CustomerMore.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cliente/CustomerOrders.jsx
try { (() => {
(() => {
  const {
    Card,
    Tabs,
    Money,
    Badge,
    Button,
    Icon,
    Avatar,
    Dialog,
    EmptyState
  } = window.AVLEDesignSystem_11270f;
  const ORDERS = [{
    id: '#AV-2038',
    s: 'Raiz Casa & Decoração',
    d: '27.09.26',
    v: 412.3,
    st: 'Em trânsito',
    t: 'info',
    at: 2,
    items: ['Luminária de bambu', 'Vaso Terra', 'Porta-velas'],
    ic: 'lamp'
  }, {
    id: '#AV-1987',
    s: 'Ateliê Barro',
    d: '12.09.26',
    v: 129.8,
    st: 'Entregue',
    t: 'positive',
    at: 3,
    items: ['Caneca Musgo ×2'],
    ic: 'coffee'
  }, {
    id: '#AV-1920',
    s: 'Verde Casa',
    d: '30.08.26',
    v: 89.9,
    st: 'Entregue',
    t: 'positive',
    at: 3,
    items: ['Cachepô de fibra'],
    ic: 'sprout'
  }, {
    id: '#AV-1811',
    s: 'Raiz Casa & Decoração',
    d: '02.08.26',
    v: 249,
    st: 'Cancelado',
    t: 'negative',
    at: 0,
    items: ['Manta de linho natural'],
    ic: 'layers'
  }];
  function CustomerOrders({
    toast
  }) {
    const [tab, setTab] = React.useState('all');
    const [open, setOpen] = React.useState(null);
    const list = ORDERS.filter(o => tab === 'all' || (tab === 'open' ? o.st === 'Em trânsito' : o.st === 'Entregue'));
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Meus pedidos",
      sub: ORDERS.length + ' pedidos em 2026'
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: setTab,
      items: [{
        value: 'all',
        label: 'Todos',
        count: ORDERS.length
      }, {
        value: 'open',
        label: 'Em andamento',
        count: 1
      }, {
        value: 'done',
        label: 'Entregues'
      }]
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, list.length === 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
      icon: "package",
      title: "Nada por aqui",
      body: "Seus pedidos aparecer\xE3o nesta lista."
    })), list.map(o => /*#__PURE__*/React.createElement(Card, {
      key: o.id,
      interactive: true,
      onClick: () => setOpen(o),
      style: {
        padding: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-ph",
      style: {
        width: 72,
        aspectRatio: '1',
        flex: 'none',
        borderRadius: 16
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: o.ic,
      size: 24
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 160
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, o.s), /*#__PURE__*/React.createElement(Badge, {
      tone: o.t,
      dot: true
    }, o.st)), /*#__PURE__*/React.createElement("div", {
      className: "kit-muted",
      style: {
        marginTop: 4
      }
    }, o.id, " \xB7 ", o.d, " \xB7 ", o.items.join(', '))), /*#__PURE__*/React.createElement(Money, {
      value: o.v,
      size: 18
    }), /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-right",
      size: 18,
      style: {
        color: 'var(--text-tertiary)'
      }
    }))))), /*#__PURE__*/React.createElement(Dialog, {
      open: !!open,
      onClose: () => setOpen(null),
      title: open && 'Pedido ' + open.id,
      description: open && open.s + ' · ' + open.d,
      footer: open && /*#__PURE__*/React.createElement(React.Fragment, null, open.st === 'Entregue' && /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        icon: "rotate-ccw",
        onClick: () => {
          setOpen(null);
          toast('Itens adicionados à sacola');
        }
      }, "Comprar de novo"), open.st === 'Em trânsito' && /*#__PURE__*/React.createElement(Button, {
        icon: "map-pin",
        onClick: () => {
          setOpen(null);
          toast('Link de rastreio copiado');
        }
      }, "Rastrear"))
    }, open && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, open.st !== 'Cancelado' && /*#__PURE__*/React.createElement(OrderSteps, {
      at: open.at
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16,
        borderRadius: 20,
        background: 'var(--surface-raised)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, open.items.map(i => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", null, i))), /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: 10
      }
    }, /*#__PURE__*/React.createElement("b", {
      style: {
        fontWeight: 600
      }
    }, "Total"), /*#__PURE__*/React.createElement(Money, {
      value: open.v,
      size: 20
    }))))));
  }
  window.CustomerOrders = CustomerOrders;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cliente/CustomerOrders.jsx", error: String((e && e.message) || e) }); }

// ui_kits/loja/StoreFinance.jsx
try { (() => {
(() => {
  const {
    Card,
    Stat,
    Money,
    Delta,
    Sparkline,
    ListRow,
    Badge,
    Button,
    Donut,
    Segmented
  } = window.AVLEDesignSystem_11270f;
  const PAYOUTS = [{
    d: '27.09.26',
    v: 12480.3,
    s: 'Pago',
    m: 'Pix · Itaú ••42'
  }, {
    d: '20.09.26',
    v: 9832.1,
    s: 'Pago',
    m: 'Pix · Itaú ••42'
  }, {
    d: '13.09.26',
    v: 11204.75,
    s: 'Pago',
    m: 'Pix · Itaú ••42'
  }, {
    d: '04.10.26',
    v: 14210,
    s: 'Agendado',
    m: 'Previsto'
  }];
  function StoreFinance({
    toast
  }) {
    const [range, setRange] = React.useState('30d');
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Financeiro",
      sub: "Repasses semanais toda sexta-feira"
    }, /*#__PURE__*/React.createElement(Segmented, {
      options: [{
        value: '7d',
        label: '7 dias'
      }, {
        value: '30d',
        label: '30 dias'
      }, {
        value: '90d',
        label: '90 dias'
      }],
      value: range,
      onChange: setRange
    })), /*#__PURE__*/React.createElement("div", {
      className: "g"
    }, /*#__PURE__*/React.createElement(Card, {
      className: "s5",
      variant: "accent"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 500
      }
    }, "Saldo dispon\xEDvel"), /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, "Atualizado agora")), /*#__PURE__*/React.createElement("span", {
      className: "av-money",
      style: {
        fontSize: 48
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '.5em',
        opacity: .6,
        marginRight: 6,
        fontWeight: 400
      }
    }, "R$"), "8.940", /*#__PURE__*/React.createElement("span", {
      style: {
        opacity: .55,
        fontWeight: 400
      }
    }, ",20")), /*#__PURE__*/React.createElement("div", {
      className: "kit-row"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "inverse",
      icon: "arrow-down-to-line",
      onClick: () => toast('Saque de R$ 8.940,20 solicitado')
    }, "Sacar agora"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      style: {
        color: 'inherit'
      }
    }, "Dados banc\xE1rios"))), /*#__PURE__*/React.createElement(Card, {
      className: "s3 m-half",
      title: "A receber"
    }, /*#__PURE__*/React.createElement(Stat, {
      value: 14210,
      size: 30,
      foot: "pr\xF3ximo repasse 04.10"
    })), /*#__PURE__*/React.createElement(Card, {
      className: "s4",
      title: "Taxas do per\xEDodo",
      subtitle: "Comiss\xE3o AVLE 8% + meios de pagamento"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        gap: 18
      }
    }, /*#__PURE__*/React.createElement(Donut, {
      size: 110,
      thickness: 14,
      segments: [{
        value: 8,
        color: 'var(--chart-1)'
      }, {
        value: 3.2,
        color: 'var(--chart-2)'
      }, {
        value: 1,
        hatch: true
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontSize: 13
      }
    }, [['var(--chart-1)', 'Comissão', 'R$ 3.604'], ['var(--chart-2)', 'Pagamentos', 'R$ 1.442'], ['var(--ink-600)', 'Frete', 'R$ 450']].map(([c, k, v]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      className: "kit-row",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 9,
        background: c
      }
    }), k, /*#__PURE__*/React.createElement("b", {
      style: {
        fontWeight: 600,
        marginLeft: 'auto'
      }
    }, v)))))), /*#__PURE__*/React.createElement(Card, {
      className: "s7",
      title: "Receita l\xEDquida",
      expand: true
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        alignItems: 'baseline',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Money, {
      value: 39564.1,
      size: 28
    }), /*#__PURE__*/React.createElement(Delta, {
      value: 9.1,
      label: "vs per\xEDodo anterior"
    })), /*#__PURE__*/React.createElement(Sparkline, {
      data: [18, 22, 19, 26, 24, 31, 28, 34, 30, 38, 36, 42],
      height: 180
    })), /*#__PURE__*/React.createElement(Card, {
      className: "s5",
      title: "Repasses",
      expand: true
    }, /*#__PURE__*/React.createElement("div", null, PAYOUTS.map(p => /*#__PURE__*/React.createElement(ListRow, {
      key: p.d,
      icon: p.s === 'Pago' ? 'check' : 'clock',
      title: p.d,
      subtitle: p.m,
      trailing: brl(p.v),
      trailingSub: p.s,
      trailingTone: p.s === 'Pago' ? 'positive' : undefined
    }))))));
  }
  window.StoreFinance = StoreFinance;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/loja/StoreFinance.jsx", error: String((e && e.message) || e) }); }

// ui_kits/loja/StoreOrders.jsx
try { (() => {
(() => {
  const {
    Card,
    Table,
    Tabs,
    Input,
    Badge,
    Avatar,
    Money,
    Button,
    Dialog,
    IconButton,
    Select
  } = window.AVLEDesignSystem_11270f;
  const TONE = {
    'A enviar': 'warning',
    'Em trânsito': 'info',
    'Entregue': 'positive',
    'Cancelado': 'negative',
    'Aguardando pagamento': 'neutral'
  };
  const ORDERS = [{
    id: '#AV-2041',
    c: 'Ana Lima',
    d: '28.09.26 · 14:02',
    i: 2,
    v: 289.9,
    pay: 'Pix',
    s: 'A enviar'
  }, {
    id: '#AV-2040',
    c: 'Rafael Souza',
    d: '28.09.26 · 11:47',
    i: 5,
    v: 1240,
    pay: 'Cartão 3x',
    s: 'A enviar'
  }, {
    id: '#AV-2039',
    c: 'Beatriz Nunes',
    d: '27.09.26 · 22:15',
    i: 1,
    v: 96.5,
    pay: 'Boleto',
    s: 'Aguardando pagamento'
  }, {
    id: '#AV-2038',
    c: 'Carlos Mota',
    d: '27.09.26 · 18:30',
    i: 3,
    v: 412.3,
    pay: 'Pix',
    s: 'Em trânsito'
  }, {
    id: '#AV-2037',
    c: 'Juliana Reis',
    d: '26.09.26 · 09:12',
    i: 1,
    v: 189.9,
    pay: 'Cartão',
    s: 'Entregue'
  }, {
    id: '#AV-2036',
    c: 'Pedro Alves',
    d: '25.09.26 · 16:44',
    i: 2,
    v: 358,
    pay: 'Pix',
    s: 'Entregue'
  }, {
    id: '#AV-2035',
    c: 'Lívia Castro',
    d: '25.09.26 · 10:03',
    i: 1,
    v: 249,
    pay: 'Cartão',
    s: 'Cancelado'
  }];
  function StoreOrders({
    toast
  }) {
    const [tab, setTab] = React.useState('all');
    const [q, setQ] = React.useState('');
    const [rows, setRows] = React.useState(ORDERS);
    const [open, setOpen] = React.useState(null);
    const count = s => rows.filter(r => r.s === s).length;
    const filtered = rows.filter(r => (tab === 'all' || r.s === tab) && (r.c + r.id).toLowerCase().includes(q.toLowerCase()));
    const ship = o => {
      setRows(rs => rs.map(r => r.id === o.id ? {
        ...r,
        s: 'Em trânsito'
      } : r));
      setOpen(null);
      toast('Pedido ' + o.id + ' marcado como enviado');
    };
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Pedidos",
      sub: rows.length + ' pedidos nos últimos 7 dias'
    }, /*#__PURE__*/React.createElement("span", {
      className: "kit-desktop-only"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      icon: "download"
    }, "Exportar"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: setTab,
      items: [{
        value: 'all',
        label: 'Todos',
        count: rows.length
      }, {
        value: 'A enviar',
        label: 'A enviar',
        count: count('A enviar')
      }, {
        value: 'Em trânsito',
        label: 'Em trânsito',
        count: count('Em trânsito')
      }, {
        value: 'Entregue',
        label: 'Entregues'
      }, {
        value: 'Cancelado',
        label: 'Cancelados'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        flex: '1 1 260px',
        maxWidth: 360
      }
    }, /*#__PURE__*/React.createElement(Input, {
      size: "sm",
      icon: "search",
      placeholder: "Buscar cliente ou pedido",
      value: q,
      onChange: e => setQ(e.target.value),
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "sliders-horizontal",
      label: "Filtros"
    }))), /*#__PURE__*/React.createElement(Table, {
      onRowClick: setOpen,
      rows: filtered,
      columns: [{
        key: 'id',
        label: 'Pedido',
        render: r => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
          style: {
            fontWeight: 600
          }
        }, r.id), /*#__PURE__*/React.createElement("div", {
          className: "kit-muted"
        }, r.d))
      }, {
        key: 'c',
        label: 'Cliente',
        hideOnMobile: true,
        render: r => /*#__PURE__*/React.createElement("div", {
          className: "kit-row"
        }, /*#__PURE__*/React.createElement(Avatar, {
          name: r.c,
          size: 32
        }), r.c)
      }, {
        key: 'i',
        label: 'Itens',
        hideOnMobile: true
      }, {
        key: 'pay',
        label: 'Pagamento',
        hideOnMobile: true,
        render: r => /*#__PURE__*/React.createElement("span", {
          style: {
            color: 'var(--text-secondary)'
          }
        }, r.pay)
      }, {
        key: 's',
        label: 'Status',
        render: r => /*#__PURE__*/React.createElement(Badge, {
          tone: TONE[r.s],
          dot: true
        }, r.s)
      }, {
        key: 'v',
        label: 'Total',
        align: 'right',
        render: r => /*#__PURE__*/React.createElement(Money, {
          value: r.v,
          size: 14
        })
      }]
    })), /*#__PURE__*/React.createElement(Dialog, {
      open: !!open,
      onClose: () => setOpen(null),
      title: open && 'Pedido ' + open.id,
      description: open && open.c + ' · ' + open.d,
      footer: open && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        onClick: () => setOpen(null)
      }, "Fechar"), open.s === 'A enviar' && /*#__PURE__*/React.createElement(Button, {
        icon: "truck",
        onClick: () => ship(open)
      }, "Marcar como enviado"))
    }, open && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: TONE[open.s],
      dot: true
    }, open.s), /*#__PURE__*/React.createElement("span", {
      className: "kit-muted"
    }, open.pay)), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16,
        borderRadius: 20,
        background: 'var(--surface-raised)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", null, open.i, " ", open.i > 1 ? 'itens' : 'item'), /*#__PURE__*/React.createElement(Money, {
      value: open.v - 24.9,
      size: 14
    })), /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", null, "Frete \xB7 Sedex"), /*#__PURE__*/React.createElement(Money, {
      value: 24.9,
      size: 14
    })), /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: 10
      }
    }, /*#__PURE__*/React.createElement("b", {
      style: {
        fontWeight: 600
      }
    }, "Total"), /*#__PURE__*/React.createElement(Money, {
      value: open.v,
      size: 20
    }))), /*#__PURE__*/React.createElement(Select, {
      label: "Transportadora",
      options: ['Correios · Sedex', 'Correios · PAC', 'Jadlog']
    }))));
  }
  window.StoreOrders = StoreOrders;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/loja/StoreOrders.jsx", error: String((e && e.message) || e) }); }

// ui_kits/loja/StoreOverview.jsx
try { (() => {
(() => {
  const {
    Card,
    Stat,
    Money,
    Delta,
    BarChart,
    ListRow,
    Avatar,
    Badge,
    Progress,
    Insight,
    Segmented,
    Select,
    IconButton,
    Button,
    Pill,
    Icon
  } = window.AVLEDesignSystem_11270f;
  const WEEK = [{
    label: 'Dom',
    value: 3120
  }, {
    label: 'Seg',
    value: 5480
  }, {
    label: 'Ter',
    value: 4210
  }, {
    label: 'Qua',
    value: 8920,
    highlight: true
  }, {
    label: 'Qui',
    value: 6130
  }, {
    label: 'Sex',
    value: 7340
  }, {
    label: 'Sáb',
    value: 9860
  }];
  const RECENT = [{
    n: 'Ana Lima',
    id: '#AV-2041',
    d: '28.09',
    v: 289.9,
    s: 'Pago'
  }, {
    n: 'Rafael Souza',
    id: '#AV-2040',
    d: '28.09',
    v: 1240,
    s: 'Pago'
  }, {
    n: 'Beatriz Nunes',
    id: '#AV-2039',
    d: '27.09',
    v: 96.5,
    s: 'Pendente'
  }, {
    n: 'Carlos Mota',
    id: '#AV-2038',
    d: '27.09',
    v: 412.3,
    s: 'Pago'
  }];
  const TOP = [{
    n: 'Vaso de cerâmica Terra',
    q: 84,
    v: 15951.6,
    p: 100
  }, {
    n: 'Manta de linho natural',
    q: 52,
    v: 12948,
    p: 74
  }, {
    n: 'Luminária de bambu',
    q: 37,
    v: 8843,
    p: 52
  }];
  function StoreOverview({
    go,
    toast
  }) {
    const [period, setPeriod] = React.useState('Semana');
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Ol\xE1, Marina",
      sub: "Raiz Casa & Decora\xE7\xE3o \xB7 ter\xE7a, 28 de setembro"
    }, /*#__PURE__*/React.createElement(Segmented, {
      options: ['Hoje', 'Semana', 'Mês'],
      value: period,
      onChange: setPeriod
    }), /*#__PURE__*/React.createElement("span", {
      className: "kit-desktop-only kit-row"
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "calendar",
      label: "Per\xEDodo"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "download",
      label: "Exportar"
    })), /*#__PURE__*/React.createElement(Button, {
      icon: "plus",
      onClick: () => go('produtos')
    }, "Novo produto")), /*#__PURE__*/React.createElement("div", {
      className: "g"
    }, /*#__PURE__*/React.createElement(Card, {
      className: "s4",
      title: "Receita",
      expand: true,
      onExpand: () => go('financeiro'),
      actions: /*#__PURE__*/React.createElement(Badge, {
        tone: "positive",
        dot: true
      }, "Ao vivo")
    }, /*#__PURE__*/React.createElement(Stat, {
      value: 45060.4,
      size: 44,
      delta: 12.4,
      deltaLabel: "vs semana anterior"
    }), /*#__PURE__*/React.createElement("div", {
      className: "kit-row"
    }, [['Pix', 21480], ['Cartão', 19220], ['Boleto', 4360.4]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        flex: 1,
        minWidth: 90,
        padding: '10px 12px',
        borderRadius: 16,
        background: 'var(--surface-raised)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-muted"
    }, k), /*#__PURE__*/React.createElement(Money, {
      value: v,
      size: 16,
      decimals: 0
    }))))), /*#__PURE__*/React.createElement(Card, {
      className: "s4",
      title: "Pedidos",
      expand: true,
      onExpand: () => go('pedidos')
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        gap: 24
      }
    }, /*#__PURE__*/React.createElement(Stat, {
      value: 312,
      money: false,
      size: 44,
      delta: 6,
      deltaLabel: "novos"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 140
      }
    }, [['A enviar', 12, 'warning'], ['Em trânsito', 48, 'info'], ['Devoluções', 2, 'negative']].map(([k, v, t]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: t,
      dot: true
    }, k), /*#__PURE__*/React.createElement("b", {
      style: {
        fontWeight: 600
      }
    }, v))))), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      block: true,
      iconRight: "arrow-right",
      onClick: () => go('pedidos')
    }, "Enviar 12 pedidos")), /*#__PURE__*/React.createElement(Card, {
      className: "s4",
      title: "Meta de setembro",
      subtitle: "R$ 150.000 \xB7 faltam 2 dias"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        alignItems: 'baseline'
      }
    }, /*#__PURE__*/React.createElement(Money, {
      value: 109580,
      size: 32,
      decimals: 0
    }), /*#__PURE__*/React.createElement("span", {
      className: "kit-muted"
    }, "/ R$ 150.000")), /*#__PURE__*/React.createElement(Progress, {
      value: 73,
      knob: true
    }), /*#__PURE__*/React.createElement(Insight, {
      title: "Estoque baixo em 3 produtos",
      onClick: () => go('produtos')
    }, "Reponha antes de sexta para n\xE3o perder vendas")), /*#__PURE__*/React.createElement(Card, {
      className: "s8",
      title: "Vendas",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Select, {
        size: "sm",
        options: ['Receita', 'Pedidos']
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "arrow-up-right",
        label: "Abrir"
      }))
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        alignItems: 'baseline',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Money, {
      value: 45060.4,
      size: 28
    }), /*#__PURE__*/React.createElement(Delta, {
      value: 12.4,
      label: "vs semana anterior"
    })), /*#__PURE__*/React.createElement(BarChart, {
      data: WEEK,
      height: 230,
      format: v => brl(v)
    })), /*#__PURE__*/React.createElement(Card, {
      className: "s4",
      title: "Pedidos recentes",
      expand: true,
      onExpand: () => go('pedidos')
    }, /*#__PURE__*/React.createElement("div", null, RECENT.map(r => /*#__PURE__*/React.createElement(ListRow, {
      key: r.id,
      lead: /*#__PURE__*/React.createElement(Avatar, {
        name: r.n
      }),
      title: r.n,
      subtitle: r.id + ' · ' + r.d,
      trailing: '+' + brl(r.v),
      trailingTone: r.s === 'Pago' ? 'positive' : undefined,
      trailingSub: r.s,
      onClick: () => go('pedidos')
    })))), /*#__PURE__*/React.createElement(Card, {
      className: "s6",
      title: "Mais vendidos"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, TOP.map((t, i) => /*#__PURE__*/React.createElement("div", {
      key: t.n,
      style: {
        display: 'flex',
        gap: 14,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "av-row__lead",
      style: i === 0 ? {
        background: 'var(--accent)',
        color: 'var(--text-on-accent)'
      } : null
    }, i + 1), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 500
      }
    }, t.n), /*#__PURE__*/React.createElement(Money, {
      value: t.v,
      size: 14
    })), /*#__PURE__*/React.createElement(Progress, {
      value: t.p,
      size: "sm",
      plain: true
    }), /*#__PURE__*/React.createElement("span", {
      className: "kit-muted"
    }, t.q, " vendidos")))))), /*#__PURE__*/React.createElement(Card, {
      className: "s6",
      title: "Atividade da loja"
    }, /*#__PURE__*/React.createElement("div", {
      className: "g",
      style: {
        gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
        gap: 12
      }
    }, [['eye', 'Visitas', '8.412', 9], ['percent', 'Conversão', '3,7%', 0.4], ['star', 'Avaliação', '4,8', 0.1], ['message-circle', 'Perguntas', '5', -2]].map(([ic, k, v, d]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        padding: 16,
        borderRadius: 20,
        background: 'var(--surface-raised)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "kit-muted",
      style: {
        fontSize: 13
      }
    }, k), /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 16,
      style: {
        color: 'var(--text-tertiary)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        alignItems: 'baseline'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "av-money",
      style: {
        fontSize: 26
      }
    }, v), /*#__PURE__*/React.createElement(Delta, {
      value: d,
      suffix: k === 'Perguntas' || k === 'Avaliação' ? '' : '%'
    }))))))));
  }
  window.StoreOverview = StoreOverview;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/loja/StoreOverview.jsx", error: String((e && e.message) || e) }); }

// ui_kits/loja/StoreProducts.jsx
try { (() => {
(() => {
  const {
    Card,
    Tabs,
    Input,
    Select,
    Badge,
    Money,
    Button,
    Switch,
    Dialog,
    Icon,
    IconButton,
    EmptyState
  } = window.AVLEDesignSystem_11270f;
  const PRODUCTS = [{
    id: 1,
    n: 'Vaso de cerâmica Terra',
    cat: 'Decoração',
    v: 189.9,
    q: 24,
    on: true,
    ic: 'flower-2'
  }, {
    id: 2,
    n: 'Manta de linho natural',
    cat: 'Têxtil',
    v: 249,
    q: 3,
    on: true,
    ic: 'layers'
  }, {
    id: 3,
    n: 'Luminária de bambu',
    cat: 'Iluminação',
    v: 239,
    q: 12,
    on: true,
    ic: 'lamp'
  }, {
    id: 4,
    n: 'Kit xícaras Musgo',
    cat: 'Mesa posta',
    v: 129.9,
    q: 2,
    on: true,
    ic: 'coffee'
  }, {
    id: 5,
    n: 'Cesto de palha P',
    cat: 'Organização',
    v: 79.9,
    q: 0,
    on: false,
    ic: 'shopping-basket'
  }, {
    id: 6,
    n: 'Quadro Folhagem',
    cat: 'Decoração',
    v: 320,
    q: 8,
    on: true,
    ic: 'image'
  }];
  function StoreProducts({
    toast
  }) {
    const [items, setItems] = React.useState(PRODUCTS);
    const [tab, setTab] = React.useState('all');
    const [q, setQ] = React.useState('');
    const [adding, setAdding] = React.useState(false);
    const low = items.filter(p => p.q > 0 && p.q <= 3).length;
    const list = items.filter(p => (tab === 'all' || (tab === 'low' ? p.q <= 3 : !p.on)) && p.n.toLowerCase().includes(q.toLowerCase()));
    const toggle = (id, v) => setItems(xs => xs.map(p => p.id === id ? {
      ...p,
      on: v
    } : p));
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
      title: "Produtos",
      sub: items.length + ' produtos · ' + low + ' com estoque baixo'
    }, /*#__PURE__*/React.createElement(Button, {
      icon: "plus",
      onClick: () => setAdding(true)
    }, "Novo produto")), /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between',
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: setTab,
      items: [{
        value: 'all',
        label: 'Todos',
        count: items.length
      }, {
        value: 'low',
        label: 'Estoque baixo',
        count: low + items.filter(p => p.q === 0).length
      }, {
        value: 'off',
        label: 'Ocultos'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '1 1 240px',
        maxWidth: 340
      }
    }, /*#__PURE__*/React.createElement(Input, {
      size: "sm",
      icon: "search",
      placeholder: "Buscar produto",
      value: q,
      onChange: e => setQ(e.target.value)
    }))), list.length === 0 ? /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
      icon: "package-search",
      title: "Nenhum produto aqui",
      body: "Ajuste os filtros ou cadastre um novo produto.",
      action: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        onClick: () => setAdding(true)
      }, "Novo produto")
    })) : /*#__PURE__*/React.createElement("div", {
      className: "g"
    }, list.map(p => /*#__PURE__*/React.createElement(Card, {
      key: p.id,
      className: "s4",
      style: {
        padding: 14,
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-ph"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: p.ic,
      size: 40
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 1
      }
    }, p.q === 0 ? /*#__PURE__*/React.createElement(Badge, {
      tone: "negative"
    }, "Esgotado") : p.q <= 3 ? /*#__PURE__*/React.createElement(Badge, {
      tone: "warning"
    }, "Restam ", p.q) : /*#__PURE__*/React.createElement(Badge, null, p.q, " em estoque")), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "ellipsis",
      size: "sm",
      variant: "filled",
      label: "Mais a\xE7\xF5es"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 6px 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-muted"
    }, p.cat), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 500
      }
    }, p.n), /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Money, {
      value: p.v,
      size: 20
    }), /*#__PURE__*/React.createElement(Switch, {
      checked: p.on,
      onChange: v => {
        toggle(p.id, v);
        toast(v ? 'Produto visível na loja' : 'Produto ocultado');
      }
    })))))), /*#__PURE__*/React.createElement(Dialog, {
      open: adding,
      onClose: () => setAdding(false),
      title: "Novo produto",
      description: "Voc\xEA pode completar fotos e varia\xE7\xF5es depois.",
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        onClick: () => setAdding(false)
      }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
        onClick: () => {
          setAdding(false);
          toast('Produto salvo como rascunho');
        }
      }, "Salvar rascunho"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Nome",
      placeholder: "Ex.: Vaso de cer\xE2mica Terra"
    }), /*#__PURE__*/React.createElement("div", {
      className: "g",
      style: {
        gridTemplateColumns: '1fr 1fr',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Pre\xE7o",
      placeholder: "R$ 0,00"
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Estoque",
      placeholder: "0",
      type: "number"
    })), /*#__PURE__*/React.createElement(Select, {
      label: "Categoria",
      options: ['Decoração', 'Têxtil', 'Iluminação', 'Mesa posta', 'Organização']
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Descri\xE7\xE3o",
      multiline: true,
      placeholder: "Materiais, medidas, cuidados\u2026"
    }))));
  }
  window.StoreProducts = StoreProducts;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/loja/StoreProducts.jsx", error: String((e && e.message) || e) }); }

// ui_kits/shared/AppShell.jsx
try { (() => {
(() => {
  const {
    TopNav,
    BottomNav,
    SideNav,
    Segmented,
    IconButton,
    Avatar,
    Logo,
    ToastStack,
    Toast
  } = window.AVLEDesignSystem_11270f;
  function useTheme() {
    const [theme, setTheme] = React.useState(() => localStorage.getItem('avle-theme') || 'dark');
    React.useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('avle-theme', theme);
    }, [theme]);
    return [theme, setTheme];
  }
  function useToast() {
    const [t, setT] = React.useState(null);
    const show = (msg, tone = 'positive') => {
      setT({
        msg,
        tone,
        k: Date.now()
      });
      clearTimeout(window.__avToast);
      window.__avToast = setTimeout(() => setT(null), 2800);
    };
    const node = t ? /*#__PURE__*/React.createElement(ToastStack, null, /*#__PURE__*/React.createElement(Toast, {
      key: t.k,
      tone: t.tone
    }, t.msg)) : null;
    return [show, node];
  }
  function ThemeSwitch({
    theme,
    setTheme
  }) {
    return /*#__PURE__*/React.createElement(Segmented, {
      className: "av-topnav__hide-m",
      options: [{
        value: 'light',
        label: 'Claro',
        icon: 'sun'
      }, {
        value: 'dark',
        label: 'Escuro',
        icon: 'moon'
      }],
      value: theme,
      onChange: setTheme
    });
  }

  /* Top-nav shell (Loja, Cliente) */
  function AppShell({
    role,
    nav,
    page,
    setPage,
    user,
    theme,
    setTheme,
    children,
    extraEnd
  }) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TopNav, {
      base: "../../",
      role: role,
      items: nav,
      value: page,
      onChange: setPage,
      onBrand: () => setPage(nav[0].value),
      end: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ThemeSwitch, {
        theme: theme,
        setTheme: setTheme
      }), extraEnd, /*#__PURE__*/React.createElement(IconButton, {
        icon: "bell",
        dot: true,
        label: "Notifica\xE7\xF5es"
      }), /*#__PURE__*/React.createElement(IconButton, {
        className: "av-topnav__hide-m",
        icon: "settings",
        label: "Configura\xE7\xF5es"
      }), /*#__PURE__*/React.createElement(Avatar, {
        name: user,
        size: 40
      }))
    }), /*#__PURE__*/React.createElement("main", {
      className: "kit-main"
    }, children), /*#__PURE__*/React.createElement(BottomNav, {
      items: nav.slice(0, 5),
      value: page,
      onChange: v => {
        setPage(v);
        window.scrollTo(0, 0);
      }
    }));
  }

  /* Side-nav shell (Admin) */
  function SideShell({
    groups,
    flat,
    page,
    setPage,
    user,
    theme,
    setTheme,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "kit-layout"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-side"
    }, /*#__PURE__*/React.createElement(SideNav, {
      groups: groups,
      value: page,
      onChange: setPage,
      header: /*#__PURE__*/React.createElement("div", {
        style: {
          padding: '6px 12px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }
      }, /*#__PURE__*/React.createElement(Logo, {
        base: "../../",
        height: 20
      }), /*#__PURE__*/React.createElement("span", {
        className: "av-topnav__role"
      }, "Admin")),
      footer: /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 12,
          borderRadius: 16,
          background: 'var(--surface-card)'
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: user,
        size: 34
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 500
        }
      }, user), /*#__PURE__*/React.createElement("div", {
        className: "kit-muted"
      }, "Super admin")))
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement(TopNav, {
      base: "../../",
      role: "Admin",
      items: [],
      value: page,
      end: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ThemeSwitch, {
        theme: theme,
        setTheme: setTheme
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "search",
        label: "Buscar"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "bell",
        dot: true,
        label: "Notifica\xE7\xF5es"
      }), /*#__PURE__*/React.createElement(Avatar, {
        name: user,
        size: 40
      }))
    }), /*#__PURE__*/React.createElement("main", {
      className: "kit-main"
    }, children), /*#__PURE__*/React.createElement(BottomNav, {
      items: flat,
      value: page,
      onChange: v => {
        setPage(v);
        window.scrollTo(0, 0);
      }
    })));
  }
  function PageHead({
    title,
    sub,
    back,
    onBack,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "kit-head"
    }, back && /*#__PURE__*/React.createElement(IconButton, {
      icon: "arrow-left",
      label: "Voltar",
      onClick: onBack
    }), /*#__PURE__*/React.createElement("h1", null, title, sub && /*#__PURE__*/React.createElement("small", null, sub)), /*#__PURE__*/React.createElement("div", {
      className: "kit-tools"
    }, children));
  }
  const brl = v => 'R$ ' + v.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  Object.assign(window, {
    AppShell,
    SideShell,
    PageHead,
    useTheme,
    useToast,
    brl
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shared/AppShell.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.Donut = __ds_scope.Donut;

__ds_ns.Sparkline = __ds_scope.Sparkline;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.Money = __ds_scope.Money;

__ds_ns.Delta = __ds_scope.Delta;

__ds_ns.Progress = __ds_scope.Progress;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Insight = __ds_scope.Insight;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.ToastStack = __ds_scope.ToastStack;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Segmented = __ds_scope.Segmented;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.SideNav = __ds_scope.SideNav;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.TopNav = __ds_scope.TopNav;

})();
