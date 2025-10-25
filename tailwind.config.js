module.exports = {
  content: [
    "./views/**/*.{ejs,html}",
    "./public/**/*.js",
    "./node_modules/preline/dist/*.js",
  ],
  plugins: [require("@tailwindcss/forms"), require("preline/plugin")],
};
