import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { z } from "zod";
import type { checklistSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type ChecklistData = z.infer<typeof checklistSchema>;

export function ChecklistPdf({ data }: { data: ChecklistData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{data.title}</Text>
        {data.items.map((item, i) => (
          <View key={i} style={pdfStyles.row}>
            <Text style={pdfStyles.body}>
              ☐ {item.text}
              {item.note ? ` — ${item.note}` : ""}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
