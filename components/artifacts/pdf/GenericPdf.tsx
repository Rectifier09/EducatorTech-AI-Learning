import { Document, Page, Text } from "@react-pdf/renderer";
import { pdfStyles } from "./pdfStyles";

export function GenericPdf({ output }: { output: string }) {
  const lines = output.length > 0 ? output.split("\n") : [""];
  return (
    <Document>
      <Page style={pdfStyles.page}>
        {lines.map((line, i) => (
          <Text key={i} style={pdfStyles.body}>
            {line || " "}
          </Text>
        ))}
      </Page>
    </Document>
  );
}
