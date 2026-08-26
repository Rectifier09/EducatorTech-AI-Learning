import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { z } from "zod";
import type { feedbackListSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type FeedbackListData = z.infer<typeof feedbackListSchema>;

export function FeedbackListPdf({ data }: { data: FeedbackListData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{data.title}</Text>
        {data.items.map((item, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <Text style={pdfStyles.body}>
              {item.label ? `${item.label}: ` : ""}
              {item.comment}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
