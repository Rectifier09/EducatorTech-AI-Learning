import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { z } from "zod";
import type { rubricSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type RubricData = z.infer<typeof rubricSchema>;

export function RubricPdf({ data }: { data: RubricData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{data.title}</Text>
        {data.criteria.map((c, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Text style={pdfStyles.subheading}>{c.name}</Text>
            {c.levels.map((lvl, j) => (
              <Text key={j} style={pdfStyles.body}>
                {lvl.label}: {lvl.description}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
