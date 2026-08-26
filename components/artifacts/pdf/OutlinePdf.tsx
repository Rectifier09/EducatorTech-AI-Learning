import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { z } from "zod";
import type { outlineSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type OutlineData = z.infer<typeof outlineSchema>;

export function OutlinePdf({ data }: { data: OutlineData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{data.title}</Text>
        {data.sections.map((s, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Text style={pdfStyles.subheading}>
              {s.heading}
              {s.timeEstimate ? `  (${s.timeEstimate})` : ""}
            </Text>
            {s.bullets.map((b, j) => (
              <Text key={j} style={pdfStyles.muted}>
                • {b}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
