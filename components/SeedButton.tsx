'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { useState } from 'react';
import { Loader2, Database } from 'lucide-react';

export const SeedButton = () => {
  const [loading, setLoading] = useState(false);

  const seedData = async () => {
    setLoading(true);
    try {
      // Check if programs already exist
      const q = query(collection(db, 'programs'), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        alert("Data already seeded!");
        return;
      }

      // Add Programs
      const programs = [
        {
          name: "Computer Science & Engineering",
          description: "A comprehensive program covering software engineering, AI, and data science.",
          category: "Engineering",
          imageUrl: "https://picsum.photos/seed/computer-science/800/600",
          brochureUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          isActive: true,
          feeStructure: { applicationFee: 100, admissionFee: 5000 },
          eligibilityRules: [
            { field: "marks_12th", operator: ">=", value: 75 },
            { field: "math_score", operator: ">=", value: 80 }
          ],
          meritFormula: "(0.7 * marks_12th) + (0.3 * entrance_score)",
          duration: "4 Years",
          createdAt: serverTimestamp()
        },
        {
          name: "Business Administration",
          description: "Master the art of management, finance, and marketing in a global context.",
          category: "Management",
          imageUrl: "https://picsum.photos/seed/business/800/600",
          isActive: true,
          feeStructure: { applicationFee: 80, admissionFee: 4500 },
          eligibilityRules: [
            { field: "marks_12th", operator: ">=", value: 60 }
          ],
          meritFormula: "marks_12th",
          duration: "3 Years",
          createdAt: serverTimestamp()
        },
        {
          name: "Digital Arts & Design",
          description: "Unleash your creativity with modern design tools and artistic principles.",
          category: "Arts",
          imageUrl: "https://picsum.photos/seed/arts/800/600",
          isActive: true,
          feeStructure: { applicationFee: 60, admissionFee: 3500 },
          eligibilityRules: [
            { field: "portfolio_score", operator: ">=", value: 70 }
          ],
          meritFormula: "portfolio_score",
          duration: "3 Years",
          createdAt: serverTimestamp()
        },
        {
          name: "Molecular Biology",
          description: "Explore the building blocks of life and contribute to medical breakthroughs.",
          category: "Science",
          imageUrl: "https://picsum.photos/seed/science/800/600",
          isActive: true,
          feeStructure: { applicationFee: 90, admissionFee: 4800 },
          eligibilityRules: [
            { field: "marks_12th", operator: ">=", value: 80 }
          ],
          meritFormula: "marks_12th",
          duration: "4 Years",
          createdAt: serverTimestamp()
        },
        {
          name: "Corporate Law",
          description: "Understand the legal frameworks that govern the business world.",
          category: "Law",
          imageUrl: "https://picsum.photos/seed/law/800/600",
          isActive: true,
          feeStructure: { applicationFee: 120, admissionFee: 6000 },
          eligibilityRules: [
            { field: "entrance_score", operator: ">=", value: 85 }
          ],
          meritFormula: "entrance_score",
          duration: "5 Years",
          createdAt: serverTimestamp()
        }
      ];

      for (const p of programs) {
        await addDoc(collection(db, 'programs'), p);
      }

      // Add Categories
      const categories = [
        { name: "Engineering", description: "Technical and engineering programs", createdAt: serverTimestamp() },
        { name: "Management", description: "Business and management programs", createdAt: serverTimestamp() },
        { name: "Arts", description: "Creative and digital arts programs", createdAt: serverTimestamp() },
        { name: "Science", description: "Natural and applied science programs", createdAt: serverTimestamp() },
        { name: "Law", description: "Legal and corporate law programs", createdAt: serverTimestamp() }
      ];

      for (const c of categories) {
        await addDoc(collection(db, 'categories'), c);
      }

      alert("Seed data added successfully!");
    } catch (error) {
      console.error("Seed error:", error);
      alert("Failed to seed data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={seedData}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-100"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
      Seed Initial Data
    </button>
  );
};
