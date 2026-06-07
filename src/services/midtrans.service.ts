export class MidtransService {
  private serverKey: string;
  private isProduction: boolean;

  constructor(serverKey: string, isProduction: boolean = false) {
    this.serverKey = serverKey;
    this.isProduction = isProduction;
  }

  private getBaseUrl() {
    return this.isProduction
      ? "https://app.midtrans.com/snap/v1"
      : "https://app.sandbox.midtrans.com/snap/v1";
  }

  private getApiBaseUrl() {
    return this.isProduction
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2";
  }

  private getAuthHeader() {
    // Basic Auth header using the server key encoded in base64
    const creds = btoa(this.serverKey + ":");
    return `Basic ${creds}`;
  }

  async createTransaction(orderId: string, grossAmount: number, customerDetails?: { name: string; email: string }) {
    const url = `${this.getBaseUrl()}/transactions`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount,
        },
        credit_card: {
          secure: true,
        },
        customer_details: customerDetails ? {
          first_name: customerDetails.name,
          email: customerDetails.email,
        } : undefined,
      }),
    });

    if (response.status !== 201 && response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`Midtrans API failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async getTransactionStatus(orderId: string) {
    const url = `${this.getApiBaseUrl()}/${orderId}/status`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: this.getAuthHeader(),
      },
    });

    if (response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`Midtrans status API failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
}
