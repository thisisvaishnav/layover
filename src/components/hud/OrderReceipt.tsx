"use client";
import { useGameStore } from "@/lib/game/store";
import { Receipt } from "lucide-react";

export function OrderReceipt() {
  const { order, showTranslation } = useGameStore();

  const subtotal = order.reduce((acc, item) => acc + item.priceEur, 0);
  const iva = subtotal * 0.1; // 10% Spanish hospitality VAT
  const total = subtotal + iva;

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between font-mono">
      <div>
        {/* Receipt Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-sans">
              Comanda del Café
            </h3>
          </div>
          <span className="text-[10px] text-stone-500 uppercase">Mesa 4</span>
        </div>

        {/* Café Branding */}
        <div className="text-center mb-3 pb-2 border-b border-dashed border-stone-800">
          <h4 className="text-xs font-bold text-stone-300">CAFÉ DE LA LUNA</h4>
          <p className="text-[10px] text-stone-500 font-sans">
            Calle de las Huertas, Madrid
          </p>
        </div>

        {/* Order Items */}
        {order.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-500 font-sans italic">
            Aún no has pedido nada. Di a Mateo lo que deseas tomar.
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {order.map((item, idx) => (
              <div
                key={item.id || idx}
                className="text-xs text-stone-300 border-b border-stone-850 pb-1.5"
              >
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-stone-200">
                    {item.quantity}x {item.spanishName}
                  </span>
                  <span className="text-amber-300">
                    {item.priceEur.toFixed(2)}€
                  </span>
                </div>
                {showTranslation && (
                  <span className="text-[10px] text-stone-500 block font-sans">
                    ({item.name})
                  </span>
                )}
                {item.modifications.length > 0 && (
                  <div className="text-[10px] text-amber-400/80 mt-0.5 pl-2 border-l border-amber-500/30">
                    {item.modifications.map((mod, mIdx) => (
                      <span key={mIdx} className="block">
                        • {mod}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      {order.length > 0 && (
        <div className="border-t border-dashed border-stone-800 pt-2 text-xs space-y-1">
          <div className="flex justify-between text-stone-400">
            <span>Base imponible</span>
            <span>{subtotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-stone-400">
            <span>I.V.A. (10%)</span>
            <span>{iva.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-amber-300 pt-1 border-t border-stone-800">
            <span>TOTAL</span>
            <span>{total.toFixed(2)}€</span>
          </div>
        </div>
      )}
    </div>
  );
}
