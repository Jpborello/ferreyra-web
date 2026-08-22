-- Ejecutar esto en el SQL Editor de Supabase (Dashboard > SQL Editor > New query)
--
-- PROBLEMA QUE RESUELVE: el número de ticket de sorteo se calculaba en el
-- cliente así: "contar cuántos tickets hay para este sorteo, sumar 1". Si
-- dos clientes finalizan su compra casi al mismo tiempo durante un sorteo
-- activo, ambos pueden leer el mismo conteo antes de que el otro termine
-- de insertar, y terminan con el mismo ticket_number. Para un sorteo con
-- entrega física de números, eso es un problema real de integridad.
--
-- SOLUCION: una función de Postgres que calcula el próximo número Y hace
-- el insert dentro de la misma transacción, tomando un advisory lock por
-- sorteo (pg_advisory_xact_lock) para que dos llamadas concurrentes para
-- el MISMO sorteo se serialicen automáticamente (una espera a la otra en
-- vez de pisarse). Además se agrega una constraint UNIQUE como respaldo,
-- por si en el futuro algo vuelve a insertar tickets de otra forma.

-- 1. Respaldo: nunca puede haber dos tickets con el mismo número en el
--    mismo sorteo, pase lo que pase.
-- (Postgres no soporta "ADD CONSTRAINT IF NOT EXISTS", por eso el chequeo manual)
-- Si este paso falla con "could not create unique index... duplicate key
-- value", es porque ya existen tickets duplicados de antes (producto del
-- mismo bug que este script arregla). Hay que revisarlos y renumerarlos a
-- mano antes de poder agregar la constraint:
--   SELECT raffle_id, ticket_number, count(*) FROM public.raffle_tickets
--   GROUP BY raffle_id, ticket_number HAVING count(*) > 1;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'raffle_tickets_raffle_id_ticket_number_key'
    ) THEN
        ALTER TABLE public.raffle_tickets
            ADD CONSTRAINT raffle_tickets_raffle_id_ticket_number_key
            UNIQUE (raffle_id, ticket_number);
    END IF;
END $$;

-- 2. La función que reemplaza el "contar + insertar" del cliente.
CREATE OR REPLACE FUNCTION public.create_raffle_ticket(
    p_raffle_id uuid,
    p_order_id uuid,
    p_customer_name text
)
RETURNS public.raffle_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_next_num int;
    v_ticket public.raffle_tickets;
BEGIN
    -- Serializa las llamadas concurrentes para el mismo sorteo. El lock se
    -- libera solo al terminar la transacción (xact_lock), así que otra
    -- llamada para el mismo raffle_id espera acá hasta que esta termine.
    PERFORM pg_advisory_xact_lock(hashtext(p_raffle_id::text));

    SELECT COALESCE(MAX(ticket_number::int), 0) + 1 INTO v_next_num
    FROM public.raffle_tickets
    WHERE raffle_id = p_raffle_id;

    INSERT INTO public.raffle_tickets (raffle_id, order_id, customer_name, ticket_number)
    VALUES (p_raffle_id, p_order_id, p_customer_name, lpad(v_next_num::text, 3, '0'))
    RETURNING * INTO v_ticket;

    RETURN v_ticket;
END;
$$;

-- 3. Permitir que el checkout público (rol anon) llame a esta función.
--    SECURITY DEFINER hace que el INSERT de adentro corra con los permisos
--    de quien creó la función (no con los del rol anon), así que esto
--    sigue funcionando aunque las políticas de RLS en raffle_tickets sean
--    más estrictas más adelante.
GRANT EXECUTE ON FUNCTION public.create_raffle_ticket(uuid, uuid, text) TO anon, authenticated;
