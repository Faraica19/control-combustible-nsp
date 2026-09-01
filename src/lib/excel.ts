import ExcelJS from "exceljs";

export async function generarExcel(
  hoja: string,
  columnas: { header: string; key: string; width?: number }[],
  filas: Record<string, unknown>[],
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(hoja);
  sheet.columns = columnas;
  sheet.getRow(1).font = { bold: true };
  sheet.addRows(filas);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function generarExcelMultihoja(
  hojas: {
    nombre: string;
    columnas: { header: string; key: string; width?: number }[];
    filas: Record<string, unknown>[];
  }[],
) {
  const workbook = new ExcelJS.Workbook();
  for (const hoja of hojas) {
    const sheet = workbook.addWorksheet(hoja.nombre);
    sheet.columns = hoja.columnas;
    sheet.getRow(1).font = { bold: true };
    sheet.addRows(hoja.filas);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export function respuestaExcel(buffer: ExcelJS.Buffer, nombreArchivo: string) {
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
