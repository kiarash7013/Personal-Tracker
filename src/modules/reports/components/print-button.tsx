"use client";

export function PrintButton() {
  return <button className="btn btn-outline-secondary no-print" onClick={() => window.print()} type="button">چاپ / ذخیره PDF</button>;
}
