import { ThemeConfig } from "antd";

export const antdTheme: ThemeConfig = {
  token: {
    // Primary Colors
    colorPrimary: "#BC8F8F",
    colorBgBase: "#FDFBF7",
    colorTextBase: "#2D2D2D",
    colorTextSecondary: "#6B705C",
    colorBorder: "#DDBEA9",
    colorBorderSecondary: "rgba(221, 190, 169, 0.35)",

    // Border radius
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // Font
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,

    // Minimal elegant box shadow
    boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 4px 16px -4px rgba(188, 143, 143, 0.08)",
    boxShadowSecondary: "0 4px 14px 0 rgba(188, 143, 143, 0.12)",
  },
  components: {
    Button: {
      borderRadius: 8,
      fontWeight: 500,
      primaryShadow: "0 2px 8px rgba(188, 143, 143, 0.25)",
      defaultShadow: "none",
    },
    Card: {
      borderRadius: 12,
      boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 4px 16px -4px rgba(188, 143, 143, 0.06)",
      headerBg: "transparent",
    },
    Input: {
      borderRadius: 8,
      paddingBlock: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Layout: {
      bodyBg: "#FDFBF7",
      headerBg: "rgba(253, 251, 247, 0.9)",
      siderBg: "#FDFBF7",
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: "rgba(188, 143, 143, 0.12)",
      itemHoverBg: "rgba(188, 143, 143, 0.06)",
      itemBorderRadius: 8,
    },
    Table: {
      borderRadius: 8,
      headerBg: "#FAF5F0",
      rowHoverBg: "rgba(221, 190, 169, 0.08)",
    },
    Form: {
      labelColor: "#2D2D2D",
      labelFontSize: 14,
      labelRequiredMarkColor: "#BC8F8F",
    },
    Typography: {
      titleMarginBottom: 16,
      titleMarginTop: 0,
    },
  },
};
