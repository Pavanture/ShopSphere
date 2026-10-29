ALTER TABLE product_variants
    DROP INDEX uk_product_variant_qikink_sku,
    DROP COLUMN qikink_sku;

ALTER TABLE products
    DROP COLUMN qikink_sku;

ALTER TABLE order_items
    DROP COLUMN qikink_sku;

ALTER TABLE orders
    DROP COLUMN qikink_order_id,
    DROP COLUMN qikink_status,
    DROP COLUMN qikink_error;
