export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: "#e6f5fb",
                    100: "#ccebf7",
                    200: "#99d7ef",
                    300: "#66c4e7",
                    400: "#33b0df",
                    500: "#008DD1",
                    600: "#0074ad",
                    700: "#005b88",
                    800: "#004264",
                    900: "#002940"
                }
            },
            boxShadow: {
                soft: "0 10px 30px rgba(0, 0, 0, 0.08)"
            },
            borderRadius: {
                xl: "1rem",
                "2xl": "1.5rem"
            }
        }
    },
    plugins: []
};
