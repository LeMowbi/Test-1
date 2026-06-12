// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Interface 100 % en français : apostrophes et guillemets typographiques dans le
      // JSX sont voulus — les échapper en entités rendrait les textes illisibles.
      'react/no-unescaped-entities': 'off',
      // Règles « React Compiler » : elles condamnent deux patterns ASSUMÉS du projet —
      // (1) Date.now()/new Date() pendant le rendu : choix d'architecture v4 (« jouée »,
      // créneaux passés, semaines… recalculés à chaque affichage, jamais stockés) ;
      // (2) useRef(new Animated.Value()).current : pattern canonique des animations RN.
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
    },
  },
]);
