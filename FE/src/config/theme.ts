import { ThemeConfig } from "antd";

export const antdTheme: ThemeConfig = {
  token: {
    // Color tokens
    colorPrimary: "#BC8F8F",
    colorBgBase: "#FDFBF7",
    colorTextBase: "#2D2D2D",
    colorTextSecondary: "#555555",

    // Border radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // Font
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

    // Box shadow (minimal for flat design)
    boxShadow:
      "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
    boxShadowSecondary:
      "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  },
  components: {
    Button: {
      borderRadius: 6,
      fontWeight: 500,
      primaryShadow: "none",
      defaultShadow: "none",
    },
    Card: {
      borderRadius: 8,
      boxShadow:
        "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)",
      headerBg: "transparent",
    },
    Input: {
      borderRadius: 6,
      paddingBlock: 8,
    },
    Layout: {
      bodyBg: "#FDFBF7",
      headerBg: "rgba(253, 251, 247, 0.8)",
      siderBg: "#FDFBF7",
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: "rgba(188, 143, 143, 0.1)",
      itemHoverBg: "rgba(188, 143, 143, 0.05)",
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
