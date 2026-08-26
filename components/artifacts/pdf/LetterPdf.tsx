import { Document, Page, Text } from "@react-pdf/renderer";
import type { z } from "zod";
import type { letterSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type LetterData = z.infer<typeof letterSchema>;

export function LetterPdf({ data }: { data: LetterData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        {data.greeting && <Text style={pdfStyles.body}>{data.greeting}</Text>}
        {data.paragraphs.map((p, i) => (
          <Text key={i} style={{ ...pdfStyles.body, marginBottom: 8 }}>
            {p}
          </Text>
        ))}
        {data.signOff && <Text style={pdfStyles.body}>{data.signOff}</Text>}
      </Page>
    </Document>
  );
}
