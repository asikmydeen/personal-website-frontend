import React, { useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { addCard, updateCard } from "../../../services/digitalWalletService";

const AddEditCardComponent = ({ cardData, onClose, onSaveSuccess }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (cardData && cardData.id) {
      form.setFieldsValue({
        cardholderName: cardData.cardholderName || "",
        cardNumber: cardData.cardNumber || "",
        expiryDate: cardData.expiryDate || "",
        cvv: cardData.cvv || "",
        cardType: cardData.cardType || "",
        billingAddress: cardData.billingAddress || "",
        notes: cardData.notes || "",
      });
    } else {
      form.resetFields();
    }
  }, [cardData, form]);

  const handleFinish = async (values) => {
    try {
      let response;
      if (cardData && cardData.id) {
        response = await updateCard(cardData.id, values);
      } else {
        response = await addCard(values);
      }
      if (response.success) {
        message.success("Card saved successfully");
        onSaveSuccess();
        form.resetFields();
      } else {
        message.error(response.error || "Failed to save card.");
      }
    } catch (err) {
      message.error("An unexpected error occurred.");
      console.error("Save card error:", err);
    }
  };

  return (
    <Modal
      open={true}
      title={cardData && cardData.id ? "Edit Card" : "Add New Card"}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          cardholderName: "",
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          cardType: "",
          billingAddress: "",
          notes: "",
        }}
      >
        <Form.Item
          label="Cardholder Name"
          name="cardholderName"
          rules={[{ required: true, message: "Please enter the cardholder name" }]}
        >
          <Input placeholder="John M. Doe" />
        </Form.Item>

        <Form.Item
          label="Card Number"
          name="cardNumber"
          rules={[
            { required: true, message: "Please enter the card number" },
            { pattern: /^[0-9\s]{13,19}$/, message: "Invalid card number" },
          ]}
        >
          <Input placeholder="•••• •••• •••• ••••" maxLength={19} />
        </Form.Item>

        <Form.Item
          label="Expiry Date (MM/YY)"
          name="expiryDate"
          rules={[
            { required: true, message: "Please enter the expiry date" },
            { pattern: /^(0[1-9]|1[0-2])\/([0-9]{2})$/, message: "Expiry date must be in MM/YY format" },
          ]}
        >
          <Input placeholder="MM/YY" maxLength={5} />
        </Form.Item>

        <Form.Item
          label="CVV/CVC"
          name="cvv"
          rules={[
            { required: true, message: "Please enter the CVV/CVC" },
            { pattern: /^[0-9]{3,4}$/, message: "Invalid CVV/CVC" },
          ]}
        >
          <Input placeholder="•••" maxLength={4} />
        </Form.Item>

        <Form.Item label="Card Type (Optional)" name="cardType">
          <Input placeholder="e.g., Visa, Mastercard" />
        </Form.Item>

        <Form.Item label="Billing Address (Optional)" name="billingAddress">
          <Input.TextArea rows={2} placeholder="123 Main St, Anytown, USA" />
        </Form.Item>

        <Form.Item label="Notes (Optional)" name="notes">
          <Input.TextArea rows={2} placeholder="e.g., For online purchases only" />
        </Form.Item>

        <Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {cardData && cardData.id ? "Save Changes" : "Add Card"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddEditCardComponent;
