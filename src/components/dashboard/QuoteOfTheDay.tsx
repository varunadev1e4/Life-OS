import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It is not the mountain we conquer, but ourselves.", author: "Edmund Hillary" },
  { text: "You do not rise to the level of your goals, you fall to the level of your systems.", author: "James Clear" },
  { text: "Focus is the art of knowing what to ignore.", author: "James Clear" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Energy, not time, is the fundamental currency of high performance.", author: "Jim Loehr" },
  { text: "The most important investment you can make is in yourself.", author: "Warren Buffett" },
  { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "The present moment is the only moment available to us.", author: "Thich Nhat Hanh" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "What lies within us is greater than what lies behind or before us.", author: "Ralph Waldo Emerson" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Absorb what is useful, discard what is not, add what is uniquely your own.", author: "Bruce Lee" },
  { text: "The obstacle is the way.", author: "Marcus Aurelius" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing what a good person should be. Be one.", author: "Marcus Aurelius" },
  { text: "It's not what happens to you, but how you react that matters.", author: "Epictetus" },
  { text: "Progress is not achieved by luck, but by working on yourself daily.", author: "Epictetus" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
  { text: "Perfection is achieved when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
  { text: "The quality of your life is the quality of your questions.", author: "Tony Robbins" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb" },
  { text: "Success is not final, failure is not fatal: the courage to continue is what counts.", author: "Winston Churchill" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "Yesterday is history, tomorrow is a mystery, today is a gift.", author: "Eleanor Roosevelt" },
  { text: "Wherever you are, be all there.", author: "Jim Elliot" },
  { text: "No man was ever wise by chance.", author: "Seneca" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "Empty your mind, be formless, shapeless — like water.", author: "Bruce Lee" },
  { text: "First say to yourself what you would be, and then do what you have to do.", author: "Epictetus" },
  { text: "The two most important days in life: the day you were born and the day you find out why.", author: "Mark Twain" },
  { text: "In order to write about life, first you must live it.", author: "Ernest Hemingway" },
  { text: "What we think, we become. What we feel, we attract. What we imagine, we create.", author: "Buddha" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The secret to living is giving.", author: "Tony Robbins" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "Darkness cannot drive out darkness; only light can do that.", author: "Martin Luther King Jr." },
  { text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa" },
  { text: "When you reach the end of your rope, tie a knot and hang on.", author: "Franklin D. Roosevelt" },
  { text: "Always remember that you are absolutely unique.", author: "Margaret Mead" },
  { text: "Do not go where the path may lead; go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "You will face many defeats in life, but never let yourself be defeated.", author: "Maya Angelou" },
  { text: "The most common way people give up their power is by thinking they don't have any.", author: "Alice Walker" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
]

function getDailyQuote() {
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  )
  return QUOTES[dayOfYear % QUOTES.length]
}

export function QuoteOfTheDay() {
  const quote = useMemo(() => getDailyQuote(), [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="card p-5 relative overflow-hidden"
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: 'var(--accent-violet)',
          opacity: 0.04,
          filter: 'blur(24px)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'rgba(124,106,247,0.12)' }}
        >
          <Quote size={14} style={{ color: 'var(--accent-violet)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Quote of the Day
          </p>
          <blockquote className="text-sm font-medium text-[var(--text-primary)] leading-relaxed italic">
            "{quote.text}"
          </blockquote>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">
            — {quote.author}
          </p>
        </div>
      </div>
    </motion.div>
  )
}