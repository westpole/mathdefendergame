import type { Preview } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";

import i18n from "../src/i18n/config";
import "../src/ui/styles/index.scss";
import "./storybook.css";

function WithLocale({ locale, children }: { locale: string; children: ReactNode }) {
  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

const preview: Preview = {
  globalTypes: {
    locale: {
      name: "Language",
      description: "UI language",
      defaultValue: "en",
      toolbar: {
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "uk", title: "Ukrainian" },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    backgrounds: { value: "light" },
    locale: "en",
  },

  decorators: [
    (Story, context) => (
      <WithLocale locale={context.globals.locale}>
        <Story />
      </WithLocale>
    ),
  ],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },

    backgrounds: {
      options: {
        light: { name: 'Light', value: '#ffffff' },
        'custom-gray': { name: 'Custom Gray', value: '#f0f2f5' },
        dark: { name: 'Dark', value: '#333333' },
      },
    },
  },
};

export default preview;
