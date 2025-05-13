const tailwindColors: { [key: string]: string } = {
  "bg-gray-100": "#f5f5f5",
  "bg-gray-200": "#e5e5e5",
  "bg-gray-300": "#d4d4d4",
  "bg-gray-400": "#a3a3a3",
  "bg-gray-500": "#737373",
  "bg-gray-600": "#525252",
  "bg-gray-700": "#404040",
  "bg-gray-800": "#262626",
  "bg-gray-900": "#171717",
  "text-black": "#000000",
  "text-white": "#ffffff",
};

export const colorCode = (backgroundColor: string): string => {
  const colorCode = tailwindColors.hasOwnProperty(backgroundColor)
    ? tailwindColors[backgroundColor]
    : backgroundColor;

  return colorCode;
};
