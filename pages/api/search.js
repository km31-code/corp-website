import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query } = req.query; // Get the search query from the URL
    try {
      // Search for all items in the 'lineitems' table matching the name, including storefront info
      const items = await prisma.lineitems.findMany({
        where: {
          name: {
            contains: query, // Partial match for the name (case insensitive)
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          price: true,
          createdtime: true,
          item_id: true,
          orders: {
            select: {
              storefront: true,
            },
          },
        },
        orderBy: {
          createdtime: 'desc', // Order by latest sale date
        },
      });

      if (items.length === 0) {
        return res.status(404).json({ message: "Item not found" });
      }

      return res.status(200).json(items); // Return all matching items
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
