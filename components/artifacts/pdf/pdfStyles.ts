import { StyleSheet } from "@react-pdf/renderer";

// Light, printable page — the app's own theme (app/globals.css) is dark
// and meant for on-screen viewing; a worksheet PDF is meant to be printed
// and handed to a student, so this deliberately inverts to light-on-dark
// text. Colors are still the app's real token *values*, not new ones:
// #eab54d is --gold, #332b3a is --line-2, #6e6577 is --faint.
export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#332b3a",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#eab54d",
    marginBottom: 12,
  },
  subheading: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#332b3a",
    marginTop: 10,
    marginBottom: 4,
  },
  body: {
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  muted: {
    fontSize: 10,
    color: "#6e6577",
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
});
