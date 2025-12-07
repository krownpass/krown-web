
export const formatLocalDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-CA");

export const numberFormat = (v: number) =>
    new Intl.NumberFormat("en-IN").format(v);

export const currencyFormat = (v: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(v);

