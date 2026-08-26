import { Document, Page, Text } from "@react-pdf/renderer";
import { pdfStyles } from "./pdfStyles";

function stripHeadingMarker(line: string): { text: string; isHeading: boolean } {
  const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
  return headingMatch
    ? { text: headingMatch[1], isHeading: true }
    : { text: line, isHeading: false };
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);
  return parts.map((part, j) => {
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    return boldMatch ? (
      <Text key={j} style={{ fontFamily: "Helvetica-Bold" }}>
        {boldMatch[1]}
      </Text>
    ) : (
      <Text key={j}>{part}</Text>
    );
  });
}

export function GenericPdf({ output }: { output: string }) {
  const lines = output.length > 0 ? output.split("\n") : [""];
  return (
    <Document>
      <Page style={pdfStyles.page}>
        {lines.map((line, i) => {
          const { text, isHeading } = stripHeadingMarker(line);
          return (
            <Text key={i} style={isHeading ? pdfStyles.subheading : pdfStyles.body}>
              {text ? renderInlineBold(text) : " "}
            </Text>
          );
        })}
      </Page>
    </Document>
  );
}
