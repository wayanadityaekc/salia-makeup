import { CalendarCheck, Armchair, Sparkles, Shirt, Scissors, Bell } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';
import { PREP_TITLE, PREP_INTRO, PREP_STEPS, PREP_REMINDER } from '@/lib/prepInfo';
import messages from '@/messages/id/terms.json';

export const metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description,
};

const ICONS = [CalendarCheck, Armchair, Sparkles, Shirt, Scissors];

export default function KetentuanPage() {
  return (
    <div className="container-x py-16">
      <SectionHeader eyebrow={messages.ketentuanPage.eyebrow} title={PREP_TITLE} desc={PREP_INTRO} center />

      <div className="mx-auto mt-12 max-w-2xl space-y-4">
        {PREP_STEPS.map((step, index) => {
          const Icon = ICONS[index] || Sparkles;
          return (
            <div key={index} className="flex gap-4 rounded-2xl border border-rose-line bg-white p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-soft text-rose">
                <Icon size={22} strokeWidth={1.7} />
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-bold text-ink">
                  <span className="text-rose">{index + 1}.</span> {step.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            </div>
          );
        })}

        <div className="flex gap-4 rounded-2xl border border-rose-line bg-rose-soft/60 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-rose">
            <Bell size={22} strokeWidth={1.7} />
          </div>
          <div>
            <h3 className="font-bold text-ink">{messages.ketentuanPage.reminderHeading}</h3>
            <ul className="mt-2 space-y-1.5">
              {PREP_REMINDER.map((reminder, index) => (
                <li key={index} className="flex gap-2 text-sm leading-relaxed text-ink/80">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />
                  <span>{reminder}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm italic text-muted">{messages.ketentuanPage.closing}</p>
    </div>
  );
}
