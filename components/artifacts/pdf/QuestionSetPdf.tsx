import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { z } from "zod";
import type { questionSetSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type QuestionSetData = z.infer<typeof questionSetSchema>;
const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuestionSetPdf({ data }: { data: QuestionSetData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{data.title}</Text>
        {data.instructions && <Text style={pdfStyles.muted}>{data.instructions}</Text>}
        {data.questions.map((q) => (
          <View key={q.number} style={{ marginBottom: 8 }}>
            <Text style={pdfStyles.body}>
              {q.number}. {q.prompt}
            </Text>
            {q.options && q.options.length > 0 && (
              <View style={{ marginLeft: 14 }}>
                {q.options.map((opt, i) => (
                  <Text key={i} style={pdfStyles.muted}>
                    {LETTERS[i] ?? i + 1}) {opt}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
        <Text style={pdfStyles.subheading}>Answer key</Text>
        {data.questions.map((q) => (
          <Text key={`a-${q.number}`} style={pdfStyles.muted}>
            {q.number}. {q.answer}
          </Text>
        ))}
      </Page>
    </Document>
  );
}
